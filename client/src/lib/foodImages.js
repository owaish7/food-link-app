// Small bundled set of optimized food photos, mapped by food type. Replaces the
// old 3 MB dead card image and the hotlinked Pexels URLs the cards used to show.
import veg1 from '../assets/food/veg1.jpg';
import veg2 from '../assets/food/veg2.jpg';
import vegan1 from '../assets/food/vegan1.jpg';
import nonveg1 from '../assets/food/nonveg1.jpg';
import nonveg2 from '../assets/food/nonveg2.jpg';
import def from '../assets/food/default.jpg';

const byType = {
  Vegetarian: [veg1, veg2],
  Vegan: [vegan1, veg2],
  'Non-Vegetarian': [nonveg1, nonveg2],
};

function hash(s = '') {
  const str = String(s);
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic pick so a given listing always shows the same photo.
export function foodImage(foodType, seed = 0) {
  const list = byType[foodType] || [def, veg1, veg2];
  return list[hash(seed) % list.length];
}
