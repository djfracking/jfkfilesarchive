function tokenize(query) {
    return query.toLowerCase().trim().split(/\s+/);
  }
  
  module.exports = { tokenize };
  