var Streams = {};

Streams.ReadStream = {
    init:function (arraybuffer) {
        this.buffer = arraybuffer;
        this.index = 0;
        this.uint8array = new Uint8Array(this.buffer);
    },
    set: function (index) {
        this.index = index;
    },
    skip: function (i) {
        this.index += i;
    },
    utf8: function (length) {
        var string = '';
        for (var i = 0; i < length; i++) {
            var s = String.fromCharCode(this.uint8());
            string += s;
        }
        return string;
    },
    arrayBuffer: function (length, reverse) {
        if (reverse) {
            var array = new Uint8Array(length);
            var i = length;
            while (i--) {
                array[i] = this.uint8();
            }
            return array.buffer;
        }
        return this.buffer.slice(this.index, this.index += length);
    },
    length: function () {
        return this.buffer.length;
    },
    uint8: function () {
        return this.uint8array[this.index++];
    },
    int8: function () {
        var i = this.uint8();
        return i > 0x7f ? i - 0x100 : i;
    },
    uint16: function () {
        return this.uint8() << 8 | this.uint8();
    },
    int16: function () {
        var i = this.uint16();
        return i > 0x7fff ? i - 0x10000 : i;
    },
    uint24: function () {
        return this.uint8() << 16 | this.uint8() << 8 | this.uint8();
    },
    uint32: function () {
        return this.uint8() * 0x1000000 + (this.uint8() << 16) + (this.uint8() << 8) + this.uint8();
    },
    int32: function () {
        var i = this.uint32();
        return i > 0x7fffffff ? i - 0x100000000 : i;
    },
    uint64: function () {
        return this.uint32() * 0x100000000 + this.uint32();
    },
    int64: function () {
        var i = this.uint64();
        return i > 0x7fffffffffff ? i - 0x1000000000000 : i;
    },
    float32: function () {
        return new Float32Array(this.arrayBuffer(4, true))[0];
    },
    float64: function () {
        return new Float64Array(this.arrayBuffer(8, true))[0];
    }
};

Streams.WriteStream = {
    init : function(){
        this.allocated = 1024;
        this.index = 0;
        this.array = new Uint8Array(this.allocated);
    },
    allocate: function (size) {
        if (size + this.index < this.allocated) {
            return;
        }
        var total = size + this.index;
        while (this.allocated < total) {
            this.allocated <<= 1;
        }
        var newArray = new Uint8Array(this.allocated);
        newArray.set(this.array, 0);
        this.array = newArray;
    },
    bytes: function () {
        return new Uint8Array(this.array.buffer, 0, this.index);
    },
    length: function () {
        return this.array.length;
    },
    utf8: function (string) {
        for (var i = 0; i < string.length; i++) {
            this.uint8(string.charCodeAt(i));
        }
    },
    arrayBuffer: function (buffer, reverse, length) {
        var array = new Uint8Array(buffer, 0, arguments.length < 3 ? buffer.byteLength : length);
        if (reverse) {
            var i = array.length;
            while (i--) {
                this.uint8(array[i]);
            }
            return;
        }
        this.allocate(array.length);
        this.array.set(array, this.index);
        this.index += array.length;
    },
    append: function (array) {
        this.allocate(array.length);
        this.array.set(array, this.index);
        this.index += array.length;
    },
    splitTail: function (beginLength) {
        return new Uint8Array(this.array.buffer.slice(beginLength, this.index));
    },
    uint8: function (n) {
        this.allocate(1);
        this.array[this.index++] = n;
    },
    int8: function (n) {
        this.uint8(n < 0 ? n + 0x100 : n);
    },
    uint16: function (n) {
        this.uint8(n >> 8 & 0xff);
        this.uint8(n & 0xff);
    },
    int16: function (n) {
        this.uint16(n < 0 ? n + 0x10000 : n);
    },
    uint24: function (n) {
        this.uint8(n >> 16 & 0xff);
        this.uint8(n >> 8 & 0xff);
        this.uint8(n & 0xff);
    },
    uint32: function (n) {
        this.uint8(n >> 24 & 0xff);
        this.uint8(n >> 16 & 0xff);
        this.uint8(n >> 8 & 0xff);
        this.uint8(n & 0xff);
    },
    int32: function (n) {
        this.uint32(n < 0 ? n + 0x100000000 : n);
    },
    uint64: function (n) {
        this.uint32(n / 0x100000000);
        this.uint32(n);
    },
    int64: function (n) {
        this.uint64(n < 0 ? n + 0x1000000000000 : n);
    },
    float32: function (n) {
        var b = new Float32Array(1);
        b[0] = n;
        this.arrayBuffer(b.buffer, true);
    },
    float64: function (n) {
        var b = new Float64Array(1);
        b[0] = n;
        this.arrayBuffer(b.buffer, true);
    }
};

module.exports = Streams;