exports.getUniqueArray = (list) => {
  list = list.filter((elem, index, self) => self.findIndex(
    (t) => {return (t._id === elem._id)}) === index)
  return list
}