function LinkedListItem(value) {
  this.value = value;
  this.next = null;
  this.prev = null;
}

/**
 * An implementation of a doubly-linked list, which is used for more cpu-efficient queue
 * management at the cost of memory
 */
function LinkedList() {
  this.first = null;
  this.last = null;
  this.length = 0;
}

LinkedList.prototype.push = function(val) {
  var item = new LinkedListItem(val);
  if (!this.last) {
    this.first = item;
    this.last = item;
    this.length = 1;
  } else {
    this.last.next = item;
    if (this.last.prev) {
      this.last.prev.next = item;
    }
    item.prev = this.last;
    this.last = item;
    this.length++;
  }
  return this;
}

LinkedList.prototype.shift = function(val) {
  var shifted = this.last;
  if (!shifted) {
    this.length = 0;
    return null;
  }
  if (shifted.prev) {
    shifted.prev.next = null;
  }
  this.last = shifted.prev;
  this.length--;
  return shifted.value;
}

module.exports = LinkedList;
