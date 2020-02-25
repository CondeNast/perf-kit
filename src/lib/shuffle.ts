export function shuffle<T>(items: T[]): T[] {
  // No more items to shuffle
  if (items.length < 2) {
    return items;
  }

  let number = Math.floor(Math.random() * items.length);
  let otherItems = [...items.slice(0, number), ...items.slice(number + 1)];

  return [items[number], ...shuffle(otherItems)];
}
