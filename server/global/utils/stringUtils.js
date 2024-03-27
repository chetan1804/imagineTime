exports.concatenate = (part1, part2, separator= ' ', trim=false) => {
  part1 = !part1 ? '' : part1;
  part2 = !part2 ? '' : part2;
  let str = part1 + separator + part2;
  if(trim) {
    str = str.trim();
  }
  return str;
}
