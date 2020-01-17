const _ = require('lodash')

module.exports = (fieldsToObserve, change) =>
    change.after.ref.set(_.reduce(fieldsToObserve, (acc, val) =>
        change.before.data()[val] !== change.after.data()[val]
          ? _.set(acc, val + '_filters', getSubStrings(change.after.data()[val]))
          : acc
      , {}), {merge: true})


const getSubStrings = str =>
  _.reduce(
    _.tail(str.toLowerCase().split('')),
    (acc, val) => {
      acc.push(acc[acc.length - 1] + val);
      return acc
    },
    [str.toLowerCase().split('')[0]]
  )

const recSubstr = (acc = [], val) => {
  if (val.length === 0) return acc
  else if (acc.length === 0) return recSubstr(val[0], _.tail(val))
  else {
    acc.push(acc[acc.length-1 + _.head(val)])
    return recSubstr(acc, _.tail(val))
  }
}

