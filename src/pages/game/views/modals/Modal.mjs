import * as Hex from '../../modules/Hex.mjs';
import { currentGame } from '../../modules/Game.mjs';

// Modal event listeners for game notifications and tutorial popups
// These were moved from MainGame.mjs for separation of concerns
const SPOIL_AGGREGATION_MS = 2500; // window to aggregate multiple spoil events
const SPOIL_COOLDOWN_MS = 30 * 1000; // minimum time between spoil notifications

// Farm built event
currentGame.events.on('farm-built', (evt) => {
  const { hex } = evt.detail || {};
  const now = Date.now();
  if (now - modalState.lastFarmWarningTs < 30 * 1000) return; // 30s cooldown
  modalState.lastFarmWarningTs = now;
  if (!modalState.romeFound) {
    Modal.open({ type: 'farm_before_rome_warning', once: false, priority: 5 });
    return;
  }
  // If Rome already found, check distance and warn if >5
  const romeHex = Hex.Grid.getHex({ row: evt.detail?.romeRow ?? null, col: evt.detail?.romeCol ?? null }) || null;
  // Fallback: find Rome city hex (first nation city)
  let foundRome = null;
  Hex.Grid.forEach((h) => {
    if (h.city && h.city.nation === currentGame.nations?.[0]) foundRome = foundRome || h;
  });
  const rome = romeHex || foundRome;
  if (!rome || !hex) return;
  const d = Hex.Grid.distance(hex, rome);
  if (d > 5) {
    Modal.open({ type: 'distance_spoil_warning', once: false, priority: 7, payload: { distance: d, romeTileId: { row: rome.row, col: rome.col } } });
  }
});

// When fog reveals a hex with a city belonging to Rome, mark Rome found
currentGame.events.on('hex-visible', (evt) => {
  const hex = evt.detail?.hex;
  if (!hex) return;
  if (!hex.city) return;
  // Consider Rome to be the first city of Nation index 0
  const romeNation = currentGame.nations?.[0];
  if (!romeNation) return;
  if (hex.city.nation !== romeNation) return;
  if (modalState.romeFound) return;
  modalState.romeFound = true;
  currentGame.events.emit('rome-found', { hex });
  Modal.open({ type: 'post_rome_build_guidance', once: true, priority: 5 });

  // Check for any existing farms farther than 5 tiles from Rome
  const farFarms = [];
  Hex.Grid.forEach((h) => {
    if (h.tile.improvement?.key === 'farm') {
      const d = Hex.Grid.distance(h, hex);
      if (d > 5) farFarms.push({ hex: h, distance: d });
    }
  });
  if (farFarms.length > 0) {
    Modal.open({ type: 'distance_spoil_warning', once: true, priority: 7, payload: { count: farFarms.length, example: farFarms[0] } });
  }
  // Also check for enemy units on this hex (first encounter)
  if (!modalState.seenEnemy) {
    // scan all factions' units for units on this hex that are not player's
    let enemyFound = false;
    currentGame.players.forEach((p) => {
      if (p.index === 0) return;
      p.units.forEach((u) => {
        if (u.deleted) return;
        if (u.hex === hex) enemyFound = true;
      });
    });
    if (enemyFound) {
      modalState.seenEnemy = true;
      Modal.open({ type: 'first_enemy_army', once: true, priority: 9 });
    }
  }
});

// Detect first Food arrival to Rome
currentGame.events.on('goods-moved', (evt) => {
  const { goods, promise } = evt.detail || {};
  if (!goods || typeof goods.goodsType === 'undefined') return;
  if (goods.goodsType !== 'food') return;
  if (!promise || typeof promise.then !== 'function') return;
  promise.then(() => {
    // If delivered to a City belonging to Rome
    if (goods.hex?.city && goods.hex.city.nation === currentGame.nations?.[0]) {
      if (!modalState.firstFoodArrived) {
        modalState.firstFoodArrived = true;
        Modal.open({ type: 'first_food_arrival', once: true, priority: 8 });
      }
    }
  }).catch(() => {});
});

// Rome demand increase -> show modal once
currentGame.events.on('rome-demand-increase', (evt) => {
  if (modalState.romeDemandNotified) return;
  modalState.romeDemandNotified = true;
  Modal.open({ type: 'rome_demand_increase', once: true, priority: 7, payload: { city: evt.detail?.city } });
});

// Food spoil events -> aggregate and alert player with cooldown
currentGame.events.on('food-spoiled', (evt) => {
  // Push event into buffer
  const detail = evt?.detail || {};
  const goods = detail.goods || null;
  modalState._spoilBuffer.push({ goods, rounds: detail.rounds || goods?.rounds || 0 });

  // If a timer is already set, leave it to drain later
  if (modalState._spoilTimer !== null) return;

  // Set timer to aggregate events then notify once
  modalState._spoilTimer = setTimeout(() => {
    try {
      const now = Date.now();
      // enforce cooldown
      if (now - modalState._lastSpoilNotifyTs < SPOIL_COOLDOWN_MS) {
        // clear buffer and reset timer without notifying
        modalState._spoilBuffer = [];
        modalState._spoilTimer = null;
        return;
      }

      const buffer = modalState._spoilBuffer.slice();
      const count = buffer.length;
      const totalRounds = buffer.reduce((s, b) => s + (b.rounds || 0), 0);
      const example = buffer.find(b => b.goods && b.goods.start) || buffer[0] || {};

      Modal.open({
        type: 'food_spoiled',
        once: false,
        priority: 9,
        payload: {
          count,
          totalRounds,
          exampleStart: example.goods?.start ?? null,
          goodsExample: example.goods ?? null,
        },
      });

      modalState._lastSpoilNotifyTs = now;
    } finally {
      modalState._spoilBuffer = [];
      clearTimeout(modalState._spoilTimer);
      modalState._spoilTimer = null;
    }
  }, SPOIL_AGGREGATION_MS);
});

// Warn when the player's war units (legions) are created that they need tribute/supplies
currentGame.events.on('unit-created', (evt) => {
  const unit = evt.detail?.unit;
  if (!unit) return;
  if (unit.faction !== currentGame.players[0]) return;
  if (unit.unitType === 'warrior' && !modalState.legionWarnShown) {
    modalState.legionWarnShown = true;
    Modal.open({ type: 'legion_tribute_warning', once: true, priority: 9 });
  }
});
// Modal state tracking for first-time notifications and spoilage
export const modalState = {
  romeFound: false,
  firstFoodArrived: false,
  lastFarmWarningTs: 0,
  // Spoilage aggregation state
  _spoilBuffer: [],
  _spoilTimer: null,
  _lastSpoilNotifyTs: 0,
  seenEnemy: false,
  romeDemandNotified: false,
};
// Lightweight Modal manager for the game UI
// API: Modal.open({type, title, body, payload, once=true, priority=0}) => Promise(resolved on close)
//       Modal.close()

// Load English locale strings (packaged as JSON)
import en from '../../locales/en.json' with { type: 'json' };

export default class ModalManager {
  constructor() {
    this.queue = [];
    this.isShowing = false;
    this.#seen = new Set();
    this.#createRoot();
  }

  #createRoot() {
    if (typeof document === 'undefined') return;
    this.root = document.getElementById('game-modal-root') || document.createElement('div');
    this.root.id = 'game-modal-root';
    document.body.appendChild(this.root);
  }

  open({ type, title, body, payload = {}, once = true, priority = 0 } = {}) {
    return new Promise((resolve) => {
      if (once && type && this.#seen.has(type)) {
        resolve({ skipped: true });
        return;
      }

      const item = { type, title, body, payload, once, priority, resolve };
      // insert by priority (higher first)
      const i = this.queue.findIndex(q => q.priority < priority);
      if (i === -1) this.queue.push(item); else this.queue.splice(i, 0, item);
      this.#processQueue();
    });
  }

  close(result = {}) {
    if (!this.current) return;
    const cur = this.current;
    this.#destroyCurrent();
    if (cur.once && cur.type) this.#seen.add(cur.type);
    cur.resolve(result);
    this.current = null;
    this.isShowing = false;
    // small async gap to avoid immediate re-entry
    setTimeout(() => this.#processQueue(), 50);
  }

  #processQueue() {
    if (this.isShowing) return;
    if (this.queue.length === 0) return;
    const next = this.queue.shift();
    this.current = next;
    this.isShowing = true;
    this.#render(next);
  }

  #render(item) {
    if (typeof document === 'undefined') return;
    this.#destroyCurrent();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const h = document.createElement('h2');
    h.className = 'modal-title';
    h.textContent = item.title || this.#lookupTitle(item.type) || 'Notice';

    const p = document.createElement('div');
    p.className = 'modal-body';
    // Prefer explicit body, then formatted payload-aware body, then static lookup
    p.textContent = item.body || this.#formatBody(item.type, item.payload) || this.#lookupBody(item.type) || '';

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-btn modal-btn-primary';
    closeBtn.textContent = 'OK';
    closeBtn.addEventListener('click', () => this.close({ acknowledged: true }));

    const skipBtn = document.createElement('button');
    skipBtn.className = 'modal-btn modal-btn-secondary';
    skipBtn.textContent = "Don't show again";
    skipBtn.addEventListener('click', () => this.close({ acknowledged: true, dontShowAgain: true }));

    actions.appendChild(closeBtn);
    actions.appendChild(skipBtn);

    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(actions);

    overlay.appendChild(box);
    this.root.appendChild(overlay);
    this.#currentEl = overlay;

    // focus for a11y
    closeBtn.focus();
  }

  // Format modal body using payloads for richer messages
  #formatBody(type, payload = {}) {
    try {
      switch (type) {
        case 'food_spoiled': {
          const count = payload.count ?? (payload.goods ? 1 : 0);
          const totalRounds = payload.totalRounds ?? payload.rounds ?? 0;
          const start = payload.exampleStart ?? payload.farm ?? payload.goods?.start ?? null;
          if (count > 1) {
            return `Alert: ${count} food shipments spoiled in transit (total spoil rounds: ${totalRounds}). Consider building Farms closer to Rome or improving transport.`;
          }
          if (start && typeof start.row !== 'undefined' && typeof start.col !== 'undefined') {
            return `Alert: Food spoiled in transit from Farm at ${start.row}×${start.col}. Consider building Farms closer to Rome or improving transport routes.`;
          }
          return 'Alert: Some Food spoiled in transit. Consider building Farms closer to Rome or improving transport routes.';
        }
        case 'distance_spoil_warning': {
          const d = payload.distance ?? payload.example?.distance ?? payload.exampleStart?.distance ?? null;
          if (Number.isFinite(d)) {
            return `Warning: This Farm is ${d} tiles from Rome. Food from here will spoil after 5 rounds in transit. Place Farms closer to Rome to avoid spoilage.`;
          }
          if (payload.count) {
            return `Warning: ${payload.count} Farms are more than 5 tiles from Rome. Food from these Farms will spoil after 5 rounds in transit.`;
          }
          return null;
        }
        default:
          return null;
      }
    } catch (e) {
      console.warn('Error formatting modal body', e);
      return null;
    }
  }

  #destroyCurrent() {
    if (this.#currentEl && this.#currentEl.parentNode) this.#currentEl.parentNode.removeChild(this.#currentEl);
    this.#currentEl = null;
  }

  // Basic localization lookup stub; integrators should replace with real i18n lookup
  #lookupTitle(type) {
    const titles = {
      intro_find_rome: 'Find Rome',
      farm_before_rome_warning: 'Farm built before Rome',
      post_rome_build_guidance: 'Now that Rome is found',
      distance_spoil_warning: 'Food Spoilage Warning',
      first_food_arrival: 'Supply Success',
      rome_demand_increase: 'Rome Demand Increased',
      food_spoiled: 'Food Spoiled',
      first_enemy_army: 'Enemy Army Detected',
      legion_tribute_warning: 'Legion Supply Warning'
    };
    return titles[type];
  }

  #lookupBody(type) {
    // Prefer externalized locale strings when available
    if (en && typeof en[type] === 'string') return en[type];
    const bodies = {
      intro_find_rome: "Welcome, Commander. Rome awaits — you must find Rome before you can send Food. Explore the map to locate Rome's city center.",
      farm_before_rome_warning: "Warning: You've built a Farm but Rome hasn't been found. Your Food has nowhere to go until you find Rome.",
      post_rome_build_guidance: "Well done — you've found Rome! Start building Farms within 5 tiles of Rome so Food arrives fresh.",
      distance_spoil_warning: "This Farm is more than 5 tiles from Rome. Food from here will spoil after 5 rounds in transit.",
      first_food_arrival: "Congratulations! The first Food shipment has reached Rome — your supply lines are working.",
      rome_demand_increase: "Rome's demand for Food has increased. Produce more Farms near Rome.",
      food_spoiled: "Some Food spoiled in transit. Consider building Farms closer to Rome or improving transport routes.",
      first_enemy_army: "Enemy army sighted nearby! Prepare your defenses and secure supply lines.",
      legion_tribute_warning: "Roman legionaries marching to the front need tribute and supplies. Ensure nearby Farms and stockpiles."
    };
    return bodies[type];
  }
}

// Convenience singleton for simple imports
export const Modal = new ModalManager();
