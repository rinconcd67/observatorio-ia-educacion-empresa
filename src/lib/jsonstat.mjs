function categoryCodes(dimension) {
  const index = dimension?.category?.index;
  if (Array.isArray(index)) return index;
  if (index && typeof index === "object") {
    return Object.entries(index)
      .sort((left, right) => left[1] - right[1])
      .map(([code]) => code);
  }
  return Object.keys(dimension?.category?.label ?? {});
}

export function decodeJsonStat(dataset) {
  if (!Array.isArray(dataset?.id) || !Array.isArray(dataset?.size)) {
    throw new Error("Respuesta JSON-stat inválida: faltan id o size.");
  }

  const dimensions = dataset.id.map((id, index) => ({
    id,
    size: dataset.size[index],
    codes: categoryCodes(dataset.dimension?.[id]),
  }));
  const total = dataset.size.reduce((product, size) => product * size, 1);
  const rows = [];

  for (let linearIndex = 0; linearIndex < total; linearIndex += 1) {
    const value = Array.isArray(dataset.value)
      ? dataset.value[linearIndex]
      : dataset.value?.[String(linearIndex)];
    if (value === null || value === undefined) continue;

    let remainder = linearIndex;
    const row = { value };
    for (let dimensionIndex = dimensions.length - 1; dimensionIndex >= 0; dimensionIndex -= 1) {
      const dimension = dimensions[dimensionIndex];
      const position = remainder % dimension.size;
      remainder = Math.floor(remainder / dimension.size);
      row[dimension.id] = dimension.codes[position];
    }
    rows.push(row);
  }

  return rows;
}
