(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/xudongliu/leaflet-mvt/node_modules/pbf/buffer.js":[function(require,module,exports){
'use strict';

// lightweight Buffer shim for pbf browser build
// based on code from github.com/feross/buffer (MIT-licensed)

module.exports = Buffer;

var ieee754 = require('ieee754');

var BufferMethods;

function Buffer(length) {
    var arr;
    if (length && length.length) {
        arr = length;
        length = arr.length;
    }
    var buf = new Uint8Array(length || 0);
    if (arr) buf.set(arr);

    buf.readUInt32LE = BufferMethods.readUInt32LE;
    buf.writeUInt32LE = BufferMethods.writeUInt32LE;
    buf.readInt32LE = BufferMethods.readInt32LE;
    buf.writeInt32LE = BufferMethods.writeInt32LE;
    buf.readFloatLE = BufferMethods.readFloatLE;
    buf.writeFloatLE = BufferMethods.writeFloatLE;
    buf.readDoubleLE = BufferMethods.readDoubleLE;
    buf.writeDoubleLE = BufferMethods.writeDoubleLE;
    buf.toString = BufferMethods.toString;
    buf.write = BufferMethods.write;
    buf.slice = BufferMethods.slice;
    buf.copy = BufferMethods.copy;

    buf._isBuffer = true;
    return buf;
}

var lastStr, lastStrEncoded;

BufferMethods = {
    readUInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] * 0x1000000);
    },

    writeUInt32LE: function(val, pos) {
        this[pos] = val;
        this[pos + 1] = (val >>> 8);
        this[pos + 2] = (val >>> 16);
        this[pos + 3] = (val >>> 24);
    },

    readInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] << 24);
    },

    readFloatLE:  function(pos) { return ieee754.read(this, pos, true, 23, 4); },
    readDoubleLE: function(pos) { return ieee754.read(this, pos, true, 52, 8); },

    writeFloatLE:  function(val, pos) { return ieee754.write(this, val, pos, true, 23, 4); },
    writeDoubleLE: function(val, pos) { return ieee754.write(this, val, pos, true, 52, 8); },

    toString: function(encoding, start, end) {
        var str = '',
            tmp = '';

        start = start || 0;
        end = Math.min(this.length, end || this.length);

        for (var i = start; i < end; i++) {
            var ch = this[i];
            if (ch <= 0x7F) {
                str += decodeURIComponent(tmp) + String.fromCharCode(ch);
                tmp = '';
            } else {
                tmp += '%' + ch.toString(16);
            }
        }

        str += decodeURIComponent(tmp);

        return str;
    },

    write: function(str, pos) {
        var bytes = str === lastStr ? lastStrEncoded : encodeString(str);
        for (var i = 0; i < bytes.length; i++) {
            this[pos + i] = bytes[i];
        }
    },

    slice: function(start, end) {
        return this.subarray(start, end);
    },

    copy: function(buf, pos) {
        pos = pos || 0;
        for (var i = 0; i < this.length; i++) {
            buf[pos + i] = this[i];
        }
    }
};

BufferMethods.writeInt32LE = BufferMethods.writeUInt32LE;

Buffer.byteLength = function(str) {
    lastStr = str;
    lastStrEncoded = encodeString(str);
    return lastStrEncoded.length;
};

Buffer.isBuffer = function(buf) {
    return !!(buf && buf._isBuffer);
};

function encodeString(str) {
    var length = str.length,
        bytes = [];

    for (var i = 0, c, lead; i < length; i++) {
        c = str.charCodeAt(i); // code point

        if (c > 0xD7FF && c < 0xE000) {

            if (lead) {
                if (c < 0xDC00) {
                    bytes.push(0xEF, 0xBF, 0xBD);
                    lead = c;
                    continue;

                } else {
                    c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
                    lead = null;
                }

            } else {
                if (c > 0xDBFF || (i + 1 === length)) bytes.push(0xEF, 0xBF, 0xBD);
                else lead = c;

                continue;
            }

        } else if (lead) {
            bytes.push(0xEF, 0xBF, 0xBD);
            lead = null;
        }

        if (c < 0x80) bytes.push(c);
        else if (c < 0x800) bytes.push(c >> 0x6 | 0xC0, c & 0x3F | 0x80);
        else if (c < 0x10000) bytes.push(c >> 0xC | 0xE0, c >> 0x6 & 0x3F | 0x80, c & 0x3F | 0x80);
        else bytes.push(c >> 0x12 | 0xF0, c >> 0xC & 0x3F | 0x80, c >> 0x6 & 0x3F | 0x80, c & 0x3F | 0x80);
    }
    return bytes;
}

},{"ieee754":"/Users/xudongliu/leaflet-mvt/node_modules/pbf/node_modules/ieee754/index.js"}],"/Users/xudongliu/leaflet-mvt/node_modules/pbf/index.js":[function(require,module,exports){
(function (global){
'use strict';

module.exports = Pbf;

var Buffer = global.Buffer || require('./buffer');

function Pbf(buf) {
    this.buf = !Buffer.isBuffer(buf) ? new Buffer(buf || 0) : buf;
    this.pos = 0;
    this.length = this.buf.length;
}

Pbf.Varint  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
Pbf.Fixed64 = 1; // 64-bit: double, fixed64, sfixed64
Pbf.Bytes   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
Pbf.Fixed32 = 5; // 32-bit: float, fixed32, sfixed32

var SHIFT_LEFT_32 = (1 << 16) * (1 << 16),
    SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32,
    POW_2_63 = Math.pow(2, 63);

Pbf.prototype = {

    destroy: function() {
        this.buf = null;
    },

    // === READING =================================================================

    readFields: function(readField, result, end) {
        end = end || this.length;

        while (this.pos < end) {
            var val = this.readVarint(),
                tag = val >> 3,
                startPos = this.pos;

            readField(tag, result, this);

            if (this.pos === startPos) this.skip(val);
        }
        return result;
    },

    readMessage: function(readField, result) {
        return this.readFields(readField, result, this.readVarint() + this.pos);
    },

    readFixed32: function() {
        var val = this.buf.readUInt32LE(this.pos);
        this.pos += 4;
        return val;
    },

    readSFixed32: function() {
        var val = this.buf.readInt32LE(this.pos);
        this.pos += 4;
        return val;
    },

    // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

    readFixed64: function() {
        var val = this.buf.readUInt32LE(this.pos) + this.buf.readUInt32LE(this.pos + 4) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    },

    readSFixed64: function() {
        var val = this.buf.readUInt32LE(this.pos) + this.buf.readInt32LE(this.pos + 4) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    },

    readFloat: function() {
        var val = this.buf.readFloatLE(this.pos);
        this.pos += 4;
        return val;
    },

    readDouble: function() {
        var val = this.buf.readDoubleLE(this.pos);
        this.pos += 8;
        return val;
    },

    readVarint: function() {
        var buf = this.buf,
            val, b, b0, b1, b2, b3;

        b0 = buf[this.pos++]; if (b0 < 0x80) return b0;                 b0 = b0 & 0x7f;
        b1 = buf[this.pos++]; if (b1 < 0x80) return b0 | b1 << 7;       b1 = (b1 & 0x7f) << 7;
        b2 = buf[this.pos++]; if (b2 < 0x80) return b0 | b1 | b2 << 14; b2 = (b2 & 0x7f) << 14;
        b3 = buf[this.pos++]; if (b3 < 0x80) return b0 | b1 | b2 | b3 << 21;

        val = b0 | b1 | b2 | (b3 & 0x7f) << 21;

        b = buf[this.pos++]; val += (b & 0x7f) * 0x10000000;         if (b < 0x80) return val;
        b = buf[this.pos++]; val += (b & 0x7f) * 0x800000000;        if (b < 0x80) return val;
        b = buf[this.pos++]; val += (b & 0x7f) * 0x40000000000;      if (b < 0x80) return val;
        b = buf[this.pos++]; val += (b & 0x7f) * 0x2000000000000;    if (b < 0x80) return val;
        b = buf[this.pos++]; val += (b & 0x7f) * 0x100000000000000;  if (b < 0x80) return val;
        b = buf[this.pos++]; val += (b & 0x7f) * 0x8000000000000000; if (b < 0x80) return val;

        throw new Error('Expected varint not more than 10 bytes');
    },

    readVarint64: function() {
        var startPos = this.pos,
            val = this.readVarint();

        if (val < POW_2_63) return val;

        var pos = this.pos - 2;
        while (this.buf[pos] === 0xff) pos--;
        if (pos < startPos) pos = startPos;

        val = 0;
        for (var i = 0; i < pos - startPos + 1; i++) {
            var b = ~this.buf[startPos + i] & 0x7f;
            val += i < 4 ? b << i * 7 : b * Math.pow(2, i * 7);
        }

        return -val - 1;
    },

    readSVarint: function() {
        var num = this.readVarint();
        return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
    },

    readBoolean: function() {
        return Boolean(this.readVarint());
    },

    readString: function() {
        var end = this.readVarint() + this.pos,
            str = this.buf.toString('utf8', this.pos, end);
        this.pos = end;
        return str;
    },

    readBytes: function() {
        var end = this.readVarint() + this.pos,
            buffer = this.buf.slice(this.pos, end);
        this.pos = end;
        return buffer;
    },

    // verbose for performance reasons; doesn't affect gzipped size

    readPackedVarint: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readVarint());
        return arr;
    },
    readPackedSVarint: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readSVarint());
        return arr;
    },
    readPackedBoolean: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readBoolean());
        return arr;
    },
    readPackedFloat: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readFloat());
        return arr;
    },
    readPackedDouble: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readDouble());
        return arr;
    },
    readPackedFixed32: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readFixed32());
        return arr;
    },
    readPackedSFixed32: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readSFixed32());
        return arr;
    },
    readPackedFixed64: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readFixed64());
        return arr;
    },
    readPackedSFixed64: function() {
        var end = this.readVarint() + this.pos, arr = [];
        while (this.pos < end) arr.push(this.readSFixed64());
        return arr;
    },

    skip: function(val) {
        var type = val & 0x7;
        if (type === Pbf.Varint) while (this.buf[this.pos++] > 0x7f) {}
        else if (type === Pbf.Bytes) this.pos = this.readVarint() + this.pos;
        else if (type === Pbf.Fixed32) this.pos += 4;
        else if (type === Pbf.Fixed64) this.pos += 8;
        else throw new Error('Unimplemented type: ' + type);
    },

    // === WRITING =================================================================

    writeTag: function(tag, type) {
        this.writeVarint((tag << 3) | type);
    },

    realloc: function(min) {
        var length = this.length || 16;

        while (length < this.pos + min) length *= 2;

        if (length !== this.length) {
            var buf = new Buffer(length);
            this.buf.copy(buf);
            this.buf = buf;
            this.length = length;
        }
    },

    finish: function() {
        this.length = this.pos;
        this.pos = 0;
        return this.buf.slice(0, this.length);
    },

    writeFixed32: function(val) {
        this.realloc(4);
        this.buf.writeUInt32LE(val, this.pos);
        this.pos += 4;
    },

    writeSFixed32: function(val) {
        this.realloc(4);
        this.buf.writeInt32LE(val, this.pos);
        this.pos += 4;
    },

    writeFixed64: function(val) {
        this.realloc(8);
        this.buf.writeInt32LE(val & -1, this.pos);
        this.buf.writeUInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeSFixed64: function(val) {
        this.realloc(8);
        this.buf.writeInt32LE(val & -1, this.pos);
        this.buf.writeInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeVarint: function(val) {
        val = +val;

        if (val <= 0x7f) {
            this.realloc(1);
            this.buf[this.pos++] = val;

        } else if (val <= 0x3fff) {
            this.realloc(2);
            this.buf[this.pos++] = ((val >>> 0) & 0x7f) | 0x80;
            this.buf[this.pos++] = ((val >>> 7) & 0x7f);

        } else if (val <= 0x1fffff) {
            this.realloc(3);
            this.buf[this.pos++] = ((val >>> 0) & 0x7f) | 0x80;
            this.buf[this.pos++] = ((val >>> 7) & 0x7f) | 0x80;
            this.buf[this.pos++] = ((val >>> 14) & 0x7f);

        } else if (val <= 0xfffffff) {
            this.realloc(4);
            this.buf[this.pos++] = ((val >>> 0) & 0x7f) | 0x80;
            this.buf[this.pos++] = ((val >>> 7) & 0x7f) | 0x80;
            this.buf[this.pos++] = ((val >>> 14) & 0x7f) | 0x80;
            this.buf[this.pos++] = ((val >>> 21) & 0x7f);

        } else {
            var pos = this.pos;
            while (val >= 0x80) {
                this.realloc(1);
                this.buf[this.pos++] = (val & 0xff) | 0x80;
                val /= 0x80;
            }
            this.realloc(1);
            this.buf[this.pos++] = val | 0;
            if (this.pos - pos > 10) throw new Error('Given varint doesn\'t fit into 10 bytes');
        }
    },

    writeSVarint: function(val) {
        this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
    },

    writeBoolean: function(val) {
        this.writeVarint(Boolean(val));
    },

    writeString: function(str) {
        str = String(str);
        var bytes = Buffer.byteLength(str);
        this.writeVarint(bytes);
        this.realloc(bytes);
        this.buf.write(str, this.pos);
        this.pos += bytes;
    },

    writeFloat: function(val) {
        this.realloc(4);
        this.buf.writeFloatLE(val, this.pos);
        this.pos += 4;
    },

    writeDouble: function(val) {
        this.realloc(8);
        this.buf.writeDoubleLE(val, this.pos);
        this.pos += 8;
    },

    writeBytes: function(buffer) {
        var len = buffer.length;
        this.writeVarint(len);
        this.realloc(len);
        for (var i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
    },

    writeRawMessage: function(fn, obj) {
        this.pos++; // reserve 1 byte for short message length

        // write the message directly to the buffer and see how much was written
        var startPos = this.pos;
        fn(obj, this);
        var len = this.pos - startPos;

        var varintLen =
            len <= 0x7f ? 1 :
            len <= 0x3fff ? 2 :
            len <= 0x1fffff ? 3 :
            len <= 0xfffffff ? 4 : Math.ceil(Math.log(len) / (Math.LN2 * 7));

        // if 1 byte isn't enough for encoding message length, shift the data to the right
        if (varintLen > 1) {
            this.realloc(varintLen - 1);
            for (var i = this.pos - 1; i >= startPos; i--) this.buf[i + varintLen - 1] = this.buf[i];
        }

        // finally, write the message length in the reserved place and restore the position
        this.pos = startPos - 1;
        this.writeVarint(len);
        this.pos += len;
    },

    writeMessage: function(tag, fn, obj) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeRawMessage(fn, obj);
    },

    writePackedVarint:   function(tag, arr) { this.writeMessage(tag, writePackedVarint, arr);   },
    writePackedSVarint:  function(tag, arr) { this.writeMessage(tag, writePackedSVarint, arr);  },
    writePackedBoolean:  function(tag, arr) { this.writeMessage(tag, writePackedBoolean, arr);  },
    writePackedFloat:    function(tag, arr) { this.writeMessage(tag, writePackedFloat, arr);    },
    writePackedDouble:   function(tag, arr) { this.writeMessage(tag, writePackedDouble, arr);   },
    writePackedFixed32:  function(tag, arr) { this.writeMessage(tag, writePackedFixed32, arr);  },
    writePackedSFixed32: function(tag, arr) { this.writeMessage(tag, writePackedSFixed32, arr); },
    writePackedFixed64:  function(tag, arr) { this.writeMessage(tag, writePackedFixed64, arr);  },
    writePackedSFixed64: function(tag, arr) { this.writeMessage(tag, writePackedSFixed64, arr); },

    writeBytesField: function(tag, buffer) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeBytes(buffer);
    },
    writeFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFixed32(val);
    },
    writeSFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeSFixed32(val);
    },
    writeFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeFixed64(val);
    },
    writeSFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeSFixed64(val);
    },
    writeVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeVarint(val);
    },
    writeSVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeSVarint(val);
    },
    writeStringField: function(tag, str) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeString(str);
    },
    writeFloatField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFloat(val);
    },
    writeDoubleField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeDouble(val);
    },
    writeBooleanField: function(tag, val) {
        this.writeVarintField(tag, Boolean(val));
    }
};

function writePackedVarint(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);   }
function writePackedSVarint(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);  }
function writePackedFloat(arr, pbf)    { for (var i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);    }
function writePackedDouble(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);   }
function writePackedBoolean(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);  }
function writePackedFixed32(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);  }
function writePackedSFixed32(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]); }
function writePackedFixed64(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);  }
function writePackedSFixed64(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]); }

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9wYmYvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUGJmO1xuXG52YXIgQnVmZmVyID0gZ2xvYmFsLkJ1ZmZlciB8fCByZXF1aXJlKCcuL2J1ZmZlcicpO1xuXG5mdW5jdGlvbiBQYmYoYnVmKSB7XG4gICAgdGhpcy5idWYgPSAhQnVmZmVyLmlzQnVmZmVyKGJ1ZikgPyBuZXcgQnVmZmVyKGJ1ZiB8fCAwKSA6IGJ1ZjtcbiAgICB0aGlzLnBvcyA9IDA7XG4gICAgdGhpcy5sZW5ndGggPSB0aGlzLmJ1Zi5sZW5ndGg7XG59XG5cblBiZi5WYXJpbnQgID0gMDsgLy8gdmFyaW50OiBpbnQzMiwgaW50NjQsIHVpbnQzMiwgdWludDY0LCBzaW50MzIsIHNpbnQ2NCwgYm9vbCwgZW51bVxuUGJmLkZpeGVkNjQgPSAxOyAvLyA2NC1iaXQ6IGRvdWJsZSwgZml4ZWQ2NCwgc2ZpeGVkNjRcblBiZi5CeXRlcyAgID0gMjsgLy8gbGVuZ3RoLWRlbGltaXRlZDogc3RyaW5nLCBieXRlcywgZW1iZWRkZWQgbWVzc2FnZXMsIHBhY2tlZCByZXBlYXRlZCBmaWVsZHNcblBiZi5GaXhlZDMyID0gNTsgLy8gMzItYml0OiBmbG9hdCwgZml4ZWQzMiwgc2ZpeGVkMzJcblxudmFyIFNISUZUX0xFRlRfMzIgPSAoMSA8PCAxNikgKiAoMSA8PCAxNiksXG4gICAgU0hJRlRfUklHSFRfMzIgPSAxIC8gU0hJRlRfTEVGVF8zMixcbiAgICBQT1dfMl82MyA9IE1hdGgucG93KDIsIDYzKTtcblxuUGJmLnByb3RvdHlwZSA9IHtcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmJ1ZiA9IG51bGw7XG4gICAgfSxcblxuICAgIC8vID09PSBSRUFESU5HID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICByZWFkRmllbGRzOiBmdW5jdGlvbihyZWFkRmllbGQsIHJlc3VsdCwgZW5kKSB7XG4gICAgICAgIGVuZCA9IGVuZCB8fCB0aGlzLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzLnJlYWRWYXJpbnQoKSxcbiAgICAgICAgICAgICAgICB0YWcgPSB2YWwgPj4gMyxcbiAgICAgICAgICAgICAgICBzdGFydFBvcyA9IHRoaXMucG9zO1xuXG4gICAgICAgICAgICByZWFkRmllbGQodGFnLCByZXN1bHQsIHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPT09IHN0YXJ0UG9zKSB0aGlzLnNraXAodmFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICByZWFkTWVzc2FnZTogZnVuY3Rpb24ocmVhZEZpZWxkLCByZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEZpZWxkcyhyZWFkRmllbGQsIHJlc3VsdCwgdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcyk7XG4gICAgfSxcblxuICAgIHJlYWRGaXhlZDMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmLnJlYWRVSW50MzJMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWRTRml4ZWQzMjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1Zi5yZWFkSW50MzJMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIDY0LWJpdCBpbnQgaGFuZGxpbmcgaXMgYmFzZWQgb24gZ2l0aHViLmNvbS9kcHcvbm9kZS1idWZmZXItbW9yZS1pbnRzIChNSVQtbGljZW5zZWQpXG5cbiAgICByZWFkRml4ZWQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1Zi5yZWFkVUludDMyTEUodGhpcy5wb3MpICsgdGhpcy5idWYucmVhZFVJbnQzMkxFKHRoaXMucG9zICsgNCkgKiBTSElGVF9MRUZUXzMyO1xuICAgICAgICB0aGlzLnBvcyArPSA4O1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICByZWFkU0ZpeGVkNjQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWYucmVhZFVJbnQzMkxFKHRoaXMucG9zKSArIHRoaXMuYnVmLnJlYWRJbnQzMkxFKHRoaXMucG9zICsgNCkgKiBTSElGVF9MRUZUXzMyO1xuICAgICAgICB0aGlzLnBvcyArPSA4O1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICByZWFkRmxvYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWYucmVhZEZsb2F0TEUodGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICByZWFkRG91YmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmLnJlYWREb3VibGVMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWRWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnVmID0gdGhpcy5idWYsXG4gICAgICAgICAgICB2YWwsIGIsIGIwLCBiMSwgYjIsIGIzO1xuXG4gICAgICAgIGIwID0gYnVmW3RoaXMucG9zKytdOyBpZiAoYjAgPCAweDgwKSByZXR1cm4gYjA7ICAgICAgICAgICAgICAgICBiMCA9IGIwICYgMHg3ZjtcbiAgICAgICAgYjEgPSBidWZbdGhpcy5wb3MrK107IGlmIChiMSA8IDB4ODApIHJldHVybiBiMCB8IGIxIDw8IDc7ICAgICAgIGIxID0gKGIxICYgMHg3ZikgPDwgNztcbiAgICAgICAgYjIgPSBidWZbdGhpcy5wb3MrK107IGlmIChiMiA8IDB4ODApIHJldHVybiBiMCB8IGIxIHwgYjIgPDwgMTQ7IGIyID0gKGIyICYgMHg3ZikgPDwgMTQ7XG4gICAgICAgIGIzID0gYnVmW3RoaXMucG9zKytdOyBpZiAoYjMgPCAweDgwKSByZXR1cm4gYjAgfCBiMSB8IGIyIHwgYjMgPDwgMjE7XG5cbiAgICAgICAgdmFsID0gYjAgfCBiMSB8IGIyIHwgKGIzICYgMHg3ZikgPDwgMjE7XG5cbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDEwMDAwMDAwOyAgICAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDgwMDAwMDAwMDsgICAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDQwMDAwMDAwMDAwOyAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDIwMDAwMDAwMDAwMDA7ICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDEwMDAwMDAwMDAwMDAwMDsgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDgwMDAwMDAwMDAwMDAwMDA7IGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHZhcmludCBub3QgbW9yZSB0aGFuIDEwIGJ5dGVzJyk7XG4gICAgfSxcblxuICAgIHJlYWRWYXJpbnQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydFBvcyA9IHRoaXMucG9zLFxuICAgICAgICAgICAgdmFsID0gdGhpcy5yZWFkVmFyaW50KCk7XG5cbiAgICAgICAgaWYgKHZhbCA8IFBPV18yXzYzKSByZXR1cm4gdmFsO1xuXG4gICAgICAgIHZhciBwb3MgPSB0aGlzLnBvcyAtIDI7XG4gICAgICAgIHdoaWxlICh0aGlzLmJ1Zltwb3NdID09PSAweGZmKSBwb3MtLTtcbiAgICAgICAgaWYgKHBvcyA8IHN0YXJ0UG9zKSBwb3MgPSBzdGFydFBvcztcblxuICAgICAgICB2YWwgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvcyAtIHN0YXJ0UG9zICsgMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYiA9IH50aGlzLmJ1ZltzdGFydFBvcyArIGldICYgMHg3ZjtcbiAgICAgICAgICAgIHZhbCArPSBpIDwgNCA/IGIgPDwgaSAqIDcgOiBiICogTWF0aC5wb3coMiwgaSAqIDcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC12YWwgLSAxO1xuICAgIH0sXG5cbiAgICByZWFkU1ZhcmludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBudW0gPSB0aGlzLnJlYWRWYXJpbnQoKTtcbiAgICAgICAgcmV0dXJuIG51bSAlIDIgPT09IDEgPyAobnVtICsgMSkgLyAtMiA6IG51bSAvIDI7IC8vIHppZ3phZyBlbmNvZGluZ1xuICAgIH0sXG5cbiAgICByZWFkQm9vbGVhbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKHRoaXMucmVhZFZhcmludCgpKTtcbiAgICB9LFxuXG4gICAgcmVhZFN0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLFxuICAgICAgICAgICAgc3RyID0gdGhpcy5idWYudG9TdHJpbmcoJ3V0ZjgnLCB0aGlzLnBvcywgZW5kKTtcbiAgICAgICAgdGhpcy5wb3MgPSBlbmQ7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfSxcblxuICAgIHJlYWRCeXRlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLFxuICAgICAgICAgICAgYnVmZmVyID0gdGhpcy5idWYuc2xpY2UodGhpcy5wb3MsIGVuZCk7XG4gICAgICAgIHRoaXMucG9zID0gZW5kO1xuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH0sXG5cbiAgICAvLyB2ZXJib3NlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zOyBkb2Vzbid0IGFmZmVjdCBnemlwcGVkIHNpemVcblxuICAgIHJlYWRQYWNrZWRWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkVmFyaW50KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG4gICAgcmVhZFBhY2tlZFNWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkU1ZhcmludCgpKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuICAgIHJlYWRQYWNrZWRCb29sZWFuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZEJvb2xlYW4oKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRmxvYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkRmxvYXQoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRG91YmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZERvdWJsZSgpKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuICAgIHJlYWRQYWNrZWRGaXhlZDMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZEZpeGVkMzIoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkU0ZpeGVkMzI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkU0ZpeGVkMzIoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRml4ZWQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLCBhcnIgPSBbXTtcbiAgICAgICAgd2hpbGUgKHRoaXMucG9zIDwgZW5kKSBhcnIucHVzaCh0aGlzLnJlYWRGaXhlZDY0KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG4gICAgcmVhZFBhY2tlZFNGaXhlZDY0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZFNGaXhlZDY0KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG5cbiAgICBza2lwOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB2YWwgJiAweDc7XG4gICAgICAgIGlmICh0eXBlID09PSBQYmYuVmFyaW50KSB3aGlsZSAodGhpcy5idWZbdGhpcy5wb3MrK10gPiAweDdmKSB7fVxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBQYmYuQnl0ZXMpIHRoaXMucG9zID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcztcbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gUGJmLkZpeGVkMzIpIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFBiZi5GaXhlZDY0KSB0aGlzLnBvcyArPSA4O1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcignVW5pbXBsZW1lbnRlZCB0eXBlOiAnICsgdHlwZSk7XG4gICAgfSxcblxuICAgIC8vID09PSBXUklUSU5HID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICB3cml0ZVRhZzogZnVuY3Rpb24odGFnLCB0eXBlKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQoKHRhZyA8PCAzKSB8IHR5cGUpO1xuICAgIH0sXG5cbiAgICByZWFsbG9jOiBmdW5jdGlvbihtaW4pIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHx8IDE2O1xuXG4gICAgICAgIHdoaWxlIChsZW5ndGggPCB0aGlzLnBvcyArIG1pbikgbGVuZ3RoICo9IDI7XG5cbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aCk7XG4gICAgICAgICAgICB0aGlzLmJ1Zi5jb3B5KGJ1Zik7XG4gICAgICAgICAgICB0aGlzLmJ1ZiA9IGJ1ZjtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5wb3M7XG4gICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVmLnNsaWNlKDAsIHRoaXMubGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgd3JpdGVGaXhlZDMyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZVVJbnQzMkxFKHZhbCwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgIH0sXG5cbiAgICB3cml0ZVNGaXhlZDMyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZUludDMyTEUodmFsLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgfSxcblxuICAgIHdyaXRlRml4ZWQ2NDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg4KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVJbnQzMkxFKHZhbCAmIC0xLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlVUludDMyTEUoTWF0aC5mbG9vcih2YWwgKiBTSElGVF9SSUdIVF8zMiksIHRoaXMucG9zICsgNCk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlU0ZpeGVkNjQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB0aGlzLnJlYWxsb2MoOCk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlSW50MzJMRSh2YWwgJiAtMSwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZUludDMyTEUoTWF0aC5mbG9vcih2YWwgKiBTSElGVF9SSUdIVF8zMiksIHRoaXMucG9zICsgNCk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlVmFyaW50OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFsID0gK3ZhbDtcblxuICAgICAgICBpZiAodmFsIDw9IDB4N2YpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbGxvYygxKTtcbiAgICAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gdmFsO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodmFsIDw9IDB4M2ZmZikge1xuICAgICAgICAgICAgdGhpcy5yZWFsbG9jKDIpO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMCkgJiAweDdmKSB8IDB4ODA7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICgodmFsID4+PiA3KSAmIDB4N2YpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodmFsIDw9IDB4MWZmZmZmKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxsb2MoMyk7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICgodmFsID4+PiAwKSAmIDB4N2YpIHwgMHg4MDtcbiAgICAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gKCh2YWwgPj4+IDcpICYgMHg3ZikgfCAweDgwO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMTQpICYgMHg3Zik7XG5cbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPD0gMHhmZmZmZmZmKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxsb2MoNCk7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICgodmFsID4+PiAwKSAmIDB4N2YpIHwgMHg4MDtcbiAgICAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gKCh2YWwgPj4+IDcpICYgMHg3ZikgfCAweDgwO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMTQpICYgMHg3ZikgfCAweDgwO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMjEpICYgMHg3Zik7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSB0aGlzLnBvcztcbiAgICAgICAgICAgIHdoaWxlICh2YWwgPj0gMHg4MCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVhbGxvYygxKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICh2YWwgJiAweGZmKSB8IDB4ODA7XG4gICAgICAgICAgICAgICAgdmFsIC89IDB4ODA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlYWxsb2MoMSk7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9IHZhbCB8IDA7XG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgLSBwb3MgPiAxMCkgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiB2YXJpbnQgZG9lc25cXCd0IGZpdCBpbnRvIDEwIGJ5dGVzJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgd3JpdGVTVmFyaW50OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludCh2YWwgPCAwID8gLXZhbCAqIDIgLSAxIDogdmFsICogMik7XG4gICAgfSxcblxuICAgIHdyaXRlQm9vbGVhbjogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQoQm9vbGVhbih2YWwpKTtcbiAgICB9LFxuXG4gICAgd3JpdGVTdHJpbmc6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgICAgICAgdmFyIGJ5dGVzID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3RyKTtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludChieXRlcyk7XG4gICAgICAgIHRoaXMucmVhbGxvYyhieXRlcyk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlKHN0ciwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSBieXRlcztcbiAgICB9LFxuXG4gICAgd3JpdGVGbG9hdDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg0KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVGbG9hdExFKHZhbCwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgIH0sXG5cbiAgICB3cml0ZURvdWJsZTogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg4KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVEb3VibGVMRSh2YWwsIHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gODtcbiAgICB9LFxuXG4gICAgd3JpdGVCeXRlczogZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgIHZhciBsZW4gPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICB0aGlzLndyaXRlVmFyaW50KGxlbik7XG4gICAgICAgIHRoaXMucmVhbGxvYyhsZW4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9IGJ1ZmZlcltpXTtcbiAgICB9LFxuXG4gICAgd3JpdGVSYXdNZXNzYWdlOiBmdW5jdGlvbihmbiwgb2JqKSB7XG4gICAgICAgIHRoaXMucG9zKys7IC8vIHJlc2VydmUgMSBieXRlIGZvciBzaG9ydCBtZXNzYWdlIGxlbmd0aFxuXG4gICAgICAgIC8vIHdyaXRlIHRoZSBtZXNzYWdlIGRpcmVjdGx5IHRvIHRoZSBidWZmZXIgYW5kIHNlZSBob3cgbXVjaCB3YXMgd3JpdHRlblxuICAgICAgICB2YXIgc3RhcnRQb3MgPSB0aGlzLnBvcztcbiAgICAgICAgZm4ob2JqLCB0aGlzKTtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMucG9zIC0gc3RhcnRQb3M7XG5cbiAgICAgICAgdmFyIHZhcmludExlbiA9XG4gICAgICAgICAgICBsZW4gPD0gMHg3ZiA/IDEgOlxuICAgICAgICAgICAgbGVuIDw9IDB4M2ZmZiA/IDIgOlxuICAgICAgICAgICAgbGVuIDw9IDB4MWZmZmZmID8gMyA6XG4gICAgICAgICAgICBsZW4gPD0gMHhmZmZmZmZmID8gNCA6IE1hdGguY2VpbChNYXRoLmxvZyhsZW4pIC8gKE1hdGguTE4yICogNykpO1xuXG4gICAgICAgIC8vIGlmIDEgYnl0ZSBpc24ndCBlbm91Z2ggZm9yIGVuY29kaW5nIG1lc3NhZ2UgbGVuZ3RoLCBzaGlmdCB0aGUgZGF0YSB0byB0aGUgcmlnaHRcbiAgICAgICAgaWYgKHZhcmludExlbiA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbGxvYyh2YXJpbnRMZW4gLSAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLnBvcyAtIDE7IGkgPj0gc3RhcnRQb3M7IGktLSkgdGhpcy5idWZbaSArIHZhcmludExlbiAtIDFdID0gdGhpcy5idWZbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmaW5hbGx5LCB3cml0ZSB0aGUgbWVzc2FnZSBsZW5ndGggaW4gdGhlIHJlc2VydmVkIHBsYWNlIGFuZCByZXN0b3JlIHRoZSBwb3NpdGlvblxuICAgICAgICB0aGlzLnBvcyA9IHN0YXJ0UG9zIC0gMTtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludChsZW4pO1xuICAgICAgICB0aGlzLnBvcyArPSBsZW47XG4gICAgfSxcblxuICAgIHdyaXRlTWVzc2FnZTogZnVuY3Rpb24odGFnLCBmbiwgb2JqKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuQnl0ZXMpO1xuICAgICAgICB0aGlzLndyaXRlUmF3TWVzc2FnZShmbiwgb2JqKTtcbiAgICB9LFxuXG4gICAgd3JpdGVQYWNrZWRWYXJpbnQ6ICAgZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZFZhcmludCwgYXJyKTsgICB9LFxuICAgIHdyaXRlUGFja2VkU1ZhcmludDogIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRTVmFyaW50LCBhcnIpOyAgfSxcbiAgICB3cml0ZVBhY2tlZEJvb2xlYW46ICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkQm9vbGVhbiwgYXJyKTsgIH0sXG4gICAgd3JpdGVQYWNrZWRGbG9hdDogICAgZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZEZsb2F0LCBhcnIpOyAgICB9LFxuICAgIHdyaXRlUGFja2VkRG91YmxlOiAgIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWREb3VibGUsIGFycik7ICAgfSxcbiAgICB3cml0ZVBhY2tlZEZpeGVkMzI6ICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkRml4ZWQzMiwgYXJyKTsgIH0sXG4gICAgd3JpdGVQYWNrZWRTRml4ZWQzMjogZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZFNGaXhlZDMyLCBhcnIpOyB9LFxuICAgIHdyaXRlUGFja2VkRml4ZWQ2NDogIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRGaXhlZDY0LCBhcnIpOyAgfSxcbiAgICB3cml0ZVBhY2tlZFNGaXhlZDY0OiBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkU0ZpeGVkNjQsIGFycik7IH0sXG5cbiAgICB3cml0ZUJ5dGVzRmllbGQ6IGZ1bmN0aW9uKHRhZywgYnVmZmVyKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuQnl0ZXMpO1xuICAgICAgICB0aGlzLndyaXRlQnl0ZXMoYnVmZmVyKTtcbiAgICB9LFxuICAgIHdyaXRlRml4ZWQzMkZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkMzIpO1xuICAgICAgICB0aGlzLndyaXRlRml4ZWQzMih2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVTRml4ZWQzMkZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkMzIpO1xuICAgICAgICB0aGlzLndyaXRlU0ZpeGVkMzIodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlRml4ZWQ2NEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkNjQpO1xuICAgICAgICB0aGlzLndyaXRlRml4ZWQ2NCh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVTRml4ZWQ2NEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkNjQpO1xuICAgICAgICB0aGlzLndyaXRlU0ZpeGVkNjQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlVmFyaW50RmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuVmFyaW50KTtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludCh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVTVmFyaW50RmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuVmFyaW50KTtcbiAgICAgICAgdGhpcy53cml0ZVNWYXJpbnQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlU3RyaW5nRmllbGQ6IGZ1bmN0aW9uKHRhZywgc3RyKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuQnl0ZXMpO1xuICAgICAgICB0aGlzLndyaXRlU3RyaW5nKHN0cik7XG4gICAgfSxcbiAgICB3cml0ZUZsb2F0RmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuRml4ZWQzMik7XG4gICAgICAgIHRoaXMud3JpdGVGbG9hdCh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVEb3VibGVGaWVsZDogZnVuY3Rpb24odGFnLCB2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVRhZyh0YWcsIFBiZi5GaXhlZDY0KTtcbiAgICAgICAgdGhpcy53cml0ZURvdWJsZSh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVCb29sZWFuRmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnRGaWVsZCh0YWcsIEJvb2xlYW4odmFsKSk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gd3JpdGVQYWNrZWRWYXJpbnQoYXJyLCBwYmYpICAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlVmFyaW50KGFycltpXSk7ICAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRTVmFyaW50KGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlU1ZhcmludChhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRGbG9hdChhcnIsIHBiZikgICAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRmxvYXQoYXJyW2ldKTsgICAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWREb3VibGUoYXJyLCBwYmYpICAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRG91YmxlKGFycltpXSk7ICAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRCb29sZWFuKGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlQm9vbGVhbihhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRGaXhlZDMyKGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRml4ZWQzMihhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRTRml4ZWQzMihhcnIsIHBiZikgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlU0ZpeGVkMzIoYXJyW2ldKTsgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRGaXhlZDY0KGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRml4ZWQ2NChhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRTRml4ZWQ2NChhcnIsIHBiZikgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlU0ZpeGVkNjQoYXJyW2ldKTsgfVxuIl19
},{"./buffer":"/Users/xudongliu/leaflet-mvt/node_modules/pbf/buffer.js"}],"/Users/xudongliu/leaflet-mvt/node_modules/pbf/node_modules/ieee754/index.js":[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"/Users/xudongliu/leaflet-mvt/node_modules/point-geometry/index.js":[function(require,module,exports){
'use strict';

module.exports = Point;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    clone: function() { return new Point(this.x, this.y); },

    add:     function(p) { return this.clone()._add(p);     },
    sub:     function(p) { return this.clone()._sub(p);     },
    mult:    function(k) { return this.clone()._mult(k);    },
    div:     function(k) { return this.clone()._div(k);     },
    rotate:  function(a) { return this.clone()._rotate(a);  },
    matMult: function(m) { return this.clone()._matMult(m); },
    unit:    function() { return this.clone()._unit(); },
    perp:    function() { return this.clone()._perp(); },
    round:   function() { return this.clone()._round(); },

    mag: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    equals: function(p) {
        return this.x === p.x &&
               this.y === p.y;
    },

    dist: function(p) {
        return Math.sqrt(this.distSqr(p));
    },

    distSqr: function(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y;
        return dx * dx + dy * dy;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    },

    angleWith: function(b) {
        return this.angleWithSep(b.x, b.y);
    },

    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
    angleWithSep: function(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    },

    _matMult: function(m) {
        var x = m[0] * this.x + m[1] * this.y,
            y = m[2] * this.x + m[3] * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _add: function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    },

    _sub: function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    },

    _mult: function(k) {
        this.x *= k;
        this.y *= k;
        return this;
    },

    _div: function(k) {
        this.x /= k;
        this.y /= k;
        return this;
    },

    _unit: function() {
        this._div(this.mag());
        return this;
    },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    },

    _rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
};

// constructs Point from an array if necessary
Point.convert = function (a) {
    if (a instanceof Point) {
        return a;
    }
    if (Array.isArray(a)) {
        return new Point(a[0], a[1]);
    }
    return a;
};

},{}],"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/index.js":[function(require,module,exports){
module.exports.VectorTile = require('./lib/vectortile.js');
module.exports.VectorTileFeature = require('./lib/vectortilefeature.js');
module.exports.VectorTileLayer = require('./lib/vectortilelayer.js');

},{"./lib/vectortile.js":"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortile.js","./lib/vectortilefeature.js":"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortilefeature.js","./lib/vectortilelayer.js":"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortilelayer.js"}],"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortile.js":[function(require,module,exports){
'use strict';

var VectorTileLayer = require('./vectortilelayer');

module.exports = VectorTile;

function VectorTile(pbf, end) {
    this.layers = pbf.readFields(readTile, {}, end);
}

function readTile(tag, layers, pbf) {
    if (tag === 3) {
        var layer = new VectorTileLayer(pbf, pbf.readVarint() + pbf.pos);
        if (layer.length) layers[layer.name] = layer;
    }
}


},{"./vectortilelayer":"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortilelayer.js"}],"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortilefeature.js":[function(require,module,exports){
'use strict';

var Point = require('point-geometry');

module.exports = VectorTileFeature;

function VectorTileFeature(pbf, end, extent, keys, values) {
    // Public
    this.properties = {};
    this.extent = extent;
    this.type = 0;

    // Private
    this._pbf = pbf;
    this._geometry = -1;
    this._keys = keys;
    this._values = values;

    pbf.readFields(readFeature, this, end);
}

function readFeature(tag, feature, pbf) {
    if (tag == 1) feature._id = pbf.readVarint();
    else if (tag == 2) readTag(pbf, feature);
    else if (tag == 3) feature.type = pbf.readVarint();
    else if (tag == 4) feature._geometry = pbf.pos;
}

function readTag(pbf, feature) {
    var end = pbf.readVarint() + pbf.pos;

    while (pbf.pos < end) {
        var key = feature._keys[pbf.readVarint()],
            value = feature._values[pbf.readVarint()];
        feature.properties[key] = value;
    }
}

VectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon'];

VectorTileFeature.prototype.loadGeometry = function() {
    var pbf = this._pbf;
    pbf.pos = this._geometry;

    var end = pbf.readVarint() + pbf.pos,
        cmd = 1,
        length = 0,
        x = 0,
        y = 0,
        lines = [],
        line;

    while (pbf.pos < end) {
        if (!length) {
            var cmdLen = pbf.readVarint();
            cmd = cmdLen & 0x7;
            length = cmdLen >> 3;
        }

        length--;

        if (cmd === 1 || cmd === 2) {
            x += pbf.readSVarint();
            y += pbf.readSVarint();

            if (cmd === 1) { // moveTo
                if (line) lines.push(line);
                line = [];
            }

            line.push(new Point(x, y));

        } else if (cmd === 7) {

            // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
            if (line) {
                line.push(line[0].clone()); // closePolygon
            }

        } else {
            throw new Error('unknown command ' + cmd);
        }
    }

    if (line) lines.push(line);

    return lines;
};

VectorTileFeature.prototype.bbox = function() {
    var pbf = this._pbf;
    pbf.pos = this._geometry;

    var end = pbf.readVarint() + pbf.pos,
        cmd = 1,
        length = 0,
        x = 0,
        y = 0,
        x1 = Infinity,
        x2 = -Infinity,
        y1 = Infinity,
        y2 = -Infinity;

    while (pbf.pos < end) {
        if (!length) {
            var cmdLen = pbf.readVarint();
            cmd = cmdLen & 0x7;
            length = cmdLen >> 3;
        }

        length--;

        if (cmd === 1 || cmd === 2) {
            x += pbf.readSVarint();
            y += pbf.readSVarint();
            if (x < x1) x1 = x;
            if (x > x2) x2 = x;
            if (y < y1) y1 = y;
            if (y > y2) y2 = y;

        } else if (cmd !== 7) {
            throw new Error('unknown command ' + cmd);
        }
    }

    return [x1, y1, x2, y2];
};

VectorTileFeature.prototype.toGeoJSON = function(x, y, z) {
    var size = this.extent * Math.pow(2, z),
        x0 = this.extent * x,
        y0 = this.extent * y,
        coords = this.loadGeometry(),
        type = VectorTileFeature.types[this.type];

    for (var i = 0; i < coords.length; i++) {
        var line = coords[i];
        for (var j = 0; j < line.length; j++) {
            var p = line[j], y2 = 180 - (p.y + y0) * 360 / size;
            line[j] = [
                (p.x + x0) * 360 / size - 180,
                360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90
            ];
        }
    }

    if (type === 'Point' && coords.length === 1) {
        coords = coords[0][0];
    } else if (type === 'Point') {
        coords = coords[0];
        type = 'MultiPoint';
    } else if (type === 'LineString' && coords.length === 1) {
        coords = coords[0];
    } else if (type === 'LineString') {
        type = 'MultiLineString';
    }

    return {
        type: "Feature",
        geometry: {
            type: type,
            coordinates: coords
        },
        properties: this.properties
    };
};

},{"point-geometry":"/Users/xudongliu/leaflet-mvt/node_modules/point-geometry/index.js"}],"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortilelayer.js":[function(require,module,exports){
'use strict';

var VectorTileFeature = require('./vectortilefeature.js');

module.exports = VectorTileLayer;

function VectorTileLayer(pbf, end) {
    // Public
    this.version = 1;
    this.name = null;
    this.extent = 4096;
    this.length = 0;

    // Private
    this._pbf = pbf;
    this._keys = [];
    this._values = [];
    this._features = [];

    pbf.readFields(readLayer, this, end);

    this.length = this._features.length;
}

function readLayer(tag, layer, pbf) {
    if (tag === 15) layer.version = pbf.readVarint();
    else if (tag === 1) layer.name = pbf.readString();
    else if (tag === 5) layer.extent = pbf.readVarint();
    else if (tag === 2) layer._features.push(pbf.pos);
    else if (tag === 3) layer._keys.push(pbf.readString());
    else if (tag === 4) layer._values.push(readValueMessage(pbf));
}

function readValueMessage(pbf) {
    var value = null,
        end = pbf.readVarint() + pbf.pos;

    while (pbf.pos < end) {
        var tag = pbf.readVarint() >> 3;

        value = tag === 1 ? pbf.readString() :
            tag === 2 ? pbf.readFloat() :
            tag === 3 ? pbf.readDouble() :
            tag === 4 ? pbf.readVarint64() :
            tag === 5 ? pbf.readVarint() :
            tag === 6 ? pbf.readSVarint() :
            tag === 7 ? pbf.readBoolean() : null;
    }

    return value;
}

// return feature `i` from this layer as a `VectorTileFeature`
VectorTileLayer.prototype.feature = function(i) {
    if (i < 0 || i >= this._features.length) throw new Error('feature index out of bounds');

    this._pbf.pos = this._features[i];

    var end = this._pbf.readVarint() + this._pbf.pos;
    return new VectorTileFeature(this._pbf, end, this.extent, this._keys, this._values);
};

},{"./vectortilefeature.js":"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/lib/vectortilefeature.js"}],"/Users/xudongliu/leaflet-mvt/src/MVTFeature.js":[function(require,module,exports){
/**
 * Created by Ryan Whitley, Daniel Duarte, and Nicholas Hallahan
 *    on 6/03/14.
 */
var Util = require('./MVTUtil');
var StaticLabel = require('./StaticLabel/StaticLabel.js');

module.exports = MVTFeature;

function MVTFeature(mvtLayer, vtf, ctx, id, style) {
  if (!vtf) return null;

  // Apply all of the properties of vtf to this object.
  for (var key in vtf) {
    this[key] = vtf[key];
  }

  this.mvtLayer = mvtLayer;
  this.mvtSource = mvtLayer.mvtSource;
  this.map = mvtLayer.mvtSource.map;

  this.id = id;

  this.layerLink = this.mvtSource.layerLink;
  this.toggleEnabled = true;
  this.selected = false;

  // how much we divide the coordinate from the vector tile
  this.divisor = vtf.extent / ctx.tileSize;
  this.extent = vtf.extent;
  this.tileSize = ctx.tileSize;

  //An object to store the paths and contexts for this feature
  this.tiles = {};

  this.style = style;

  //Add to the collection
  this.addTileFeature(vtf, ctx);

  var self = this;
  this.map.on('zoomend', function() {
    self.staticLabel = null;
  });

  if (style && style.dynamicLabel && typeof style.dynamicLabel === 'function') {
    this.dynamicLabel = this.mvtSource.dynamicLabel.createFeature(this);
  }

  ajax(self);
}


function ajax(self) {
  var style = self.style;
  if (style && style.ajaxSource && typeof style.ajaxSource === 'function') {
    var ajaxEndpoint = style.ajaxSource(self);
    if (ajaxEndpoint) {
      Util.getJSON(ajaxEndpoint, function(error, response, body) {
        if (error) {
          throw ['ajaxSource AJAX Error', error];
        } else {
          ajaxCallback(self, response);
          return true;
        }
      });
    }
  }
  return false;
}

function ajaxCallback(self, response) {
  self.ajaxData = response;

  /**
   * You can attach a callback function to a feature in your app
   * that will get called whenever new ajaxData comes in. This
   * can be used to update UI that looks at data from within a feature.
   *
   * setStyle may possibly have a style with a different ajaxData source,
   * and you would potentially get new contextual data for your feature.
   *
   * TODO: This needs to be documented.
   */
  if (typeof self.ajaxDataReceived === 'function') {
    self.ajaxDataReceived(self, response);
  }

  self._setStyle(self.mvtLayer.style);
  redrawTiles(self);
}

MVTFeature.prototype._setStyle = function(styleFn) {
  this.style = styleFn(this, this.ajaxData);

  // The label gets removed, and the (re)draw,
  // that is initiated by the MVTLayer creates a new label.
  this.removeLabel();
};

MVTFeature.prototype.setStyle = function(styleFn) {
  this.ajaxData = null;
  this.style = styleFn(this, null);
  var hasAjaxSource = ajax(this);
  if (!hasAjaxSource) {
    // The label gets removed, and the (re)draw,
    // that is initiated by the MVTLayer creates a new label.
    this.removeLabel();
  }
};

MVTFeature.prototype.draw = function(canvasID) {
  //Get the info from the tiles list
  var tileInfo =  this.tiles[canvasID];

  var vtf = tileInfo.vtf;
  var ctx = tileInfo.ctx;

  //Get the actual canvas from the parent layer's _tiles object.
  var xy = canvasID.split(":").slice(1, 3).join(":");
  ctx.canvas = this.mvtLayer._tiles[xy];

//  This could be used to directly compute the style function from the layer on every draw.
//  This is much less efficient...
//  this.style = this.mvtLayer.style(this);

  if (this.selected) {
    var style = this.style.selected || this.style;
  } else {
    var style = this.style;
  }

  switch (vtf.type) {
    case 1: //Point
      this._drawPoint(ctx, vtf.coordinates, style);
      if (!this.staticLabel && typeof this.style.staticLabel === 'function') {
        if (this.style.ajaxSource && !this.ajaxData) {
          break;
        }
        this._drawStaticLabel(ctx, vtf.coordinates, style);
      }
      break;

    case 2: //LineString
      this._drawLineString(ctx, vtf.coordinates, style);
      break;

    case 3: //Polygon
      this._drawPolygon(ctx, vtf.coordinates, style);
      break;

    default:
      throw new Error('Unmanaged type: ' + vtf.type);
  }

};

MVTFeature.prototype.getPathsForTile = function(canvasID) {
  //Get the info from the parts list
  return this.tiles[canvasID].paths;
};

MVTFeature.prototype.addTileFeature = function(vtf, ctx) {
  //Store the important items in the tiles list

  //We only want to store info for tiles for the current map zoom.  If it is tile info for another zoom level, ignore it
  //Also, if there are existing tiles in the list for other zoom levels, expunge them.
  var zoom = this.map.getZoom();

  if(ctx.zoom != zoom) return;

  this.clearTileFeatures(zoom); //TODO: This iterates thru all tiles every time a new tile is added.  Figure out a better way to do this.

  this.tiles[ctx.id] = {
    ctx: ctx,
    vtf: vtf,
    paths: []
  };

};


/**
 * Clear the inner list of tile features if they don't match the given zoom.
 *
 * @param zoom
 */
MVTFeature.prototype.clearTileFeatures = function(zoom) {
  //If stored tiles exist for other zoom levels, expunge them from the list.
  for (var key in this.tiles) {
     if(key.split(":")[0] != zoom) delete this.tiles[key];
  }
};

/**
 * Redraws all of the tiles associated with a feature. Useful for
 * style change and toggling.
 *
 * @param self
 */
function redrawTiles(self) {
  //Redraw the whole tile, not just this vtf
  var tiles = self.tiles;
  var mvtLayer = self.mvtLayer;

  for (var id in tiles) {
    var tileZoom = parseInt(id.split(':')[0]);
    var mapZoom = self.map.getZoom();
    if (tileZoom === mapZoom) {
      //Redraw the tile
      mvtLayer.redrawTile(id);
    }
  }
}

MVTFeature.prototype.toggle = function() {
  if (this.selected) {
    this.deselect();
  } else {
    this.select();
  }
};

MVTFeature.prototype.select = function() {
  this.selected = true;
  this.mvtSource.featureSelected(this);
  redrawTiles(this);
  var linkedFeature = this.linkedFeature();
  if (linkedFeature && linkedFeature.staticLabel && !linkedFeature.staticLabel.selected) {
    linkedFeature.staticLabel.select();
  }
};

MVTFeature.prototype.deselect = function() {
  this.selected = false;
  this.mvtSource.featureDeselected(this);
  redrawTiles(this);
  var linkedFeature = this.linkedFeature();
  if (linkedFeature && linkedFeature.staticLabel && linkedFeature.staticLabel.selected) {
    linkedFeature.staticLabel.deselect();
  }
};

MVTFeature.prototype.on = function(eventType, callback) {
  this._eventHandlers[eventType] = callback;
};

MVTFeature.prototype._drawPoint = function(ctx, coordsArray, style) {
  if (!style) return;
  if (!ctx || !ctx.canvas) return;

  var tile = this.tiles[ctx.id];

  //Get radius
  var radius = 1;
  if (typeof style.radius === 'function') {
    radius = style.radius(ctx.zoom); //Allows for scale dependent rednering
  }
  else{
    radius = style.radius;
  }

  var p = this._tilePoint(coordsArray[0][0]);
  var c = ctx.canvas;
  var ctx2d;
  try{
    ctx2d = c.getContext('2d');
  }
  catch(e){
    console.log("_drawPoint error: " + e);
    return;
  }

  ctx2d.beginPath();
  ctx2d.fillStyle = style.color;
  ctx2d.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx2d.closePath();
  ctx2d.fill();

  if(style.lineWidth && style.strokeStyle){
    ctx2d.lineWidth = style.lineWidth;
    ctx2d.strokeStyle = style.strokeStyle;
    ctx2d.stroke();
  }

  ctx2d.restore();
  tile.paths.push([p]);
};

MVTFeature.prototype._drawLineString = function(ctx, coordsArray, style) {
  if (!style) return;
  if (!ctx || !ctx.canvas) return;

  var ctx2d = ctx.canvas.getContext('2d');
  ctx2d.strokeStyle = style.color;
  ctx2d.lineWidth = style.size;
  ctx2d.beginPath();

  var projCoords = [];
  var tile = this.tiles[ctx.id];

  for (var gidx in coordsArray) {
    var coords = coordsArray[gidx];

    for (i = 0; i < coords.length; i++) {
      var method = (i === 0 ? 'move' : 'line') + 'To';
      var proj = this._tilePoint(coords[i]);
      projCoords.push(proj);
      ctx2d[method](proj.x, proj.y);
    }
  }

  ctx2d.stroke();
  ctx2d.restore();

  tile.paths.push(projCoords);
};

MVTFeature.prototype._drawPolygon = function(ctx, coordsArray, style) {
  if (!style) return;
  if (!ctx || !ctx.canvas) return;

  var ctx2d = ctx.canvas.getContext('2d');
  var outline = style.outline;

  // color may be defined via function to make choropleth work right
  if (typeof style.color === 'function') {
    ctx2d.fillStyle = style.color(ctx2d);
  } else {
    ctx2d.fillStyle = style.color;
  }

  if (outline) {
    ctx2d.strokeStyle = outline.color;
    ctx2d.lineWidth = outline.size;
  }
  ctx2d.beginPath();

  var projCoords = [];
  var tile = this.tiles[ctx.id];

  var featureLabel = this.dynamicLabel;
  if (featureLabel) {
    featureLabel.addTilePolys(ctx, coordsArray);
  }

  for (var gidx = 0, len = coordsArray.length; gidx < len; gidx++) {
    var coords = coordsArray[gidx];

    for (var i = 0; i < coords.length; i++) {
      var coord = coords[i];
      var method = (i === 0 ? 'move' : 'line') + 'To';
      var proj = this._tilePoint(coords[i]);
      projCoords.push(proj);
      ctx2d[method](proj.x, proj.y);
    }
  }

  ctx2d.closePath();
  ctx2d.fill();
  if (outline) {
    ctx2d.stroke();
  }

  tile.paths.push(projCoords);

};

MVTFeature.prototype._drawStaticLabel = function(ctx, coordsArray, style) {
  if (!style) return;
  if (!ctx) return;

  // If the corresponding layer is not on the map, 
  // we dont want to put on a label.
  if (!this.mvtLayer._map) return;

  var vecPt = this._tilePoint(coordsArray[0][0]);

  // We're making a standard Leaflet Marker for this label.
  var p = this._project(vecPt, ctx.tile.x, ctx.tile.y, this.extent, this.tileSize); //vectile pt to merc pt
  var mercPt = L.point(p.x, p.y); // make into leaflet obj
  var latLng = this.map.unproject(mercPt); // merc pt to latlng

  this.staticLabel = new StaticLabel(this, ctx, latLng, style);
  this.mvtLayer.featureWithLabelAdded(this);
};

MVTFeature.prototype.removeLabel = function() {
  if (!this.staticLabel) return;
  this.staticLabel.remove();
  this.staticLabel = null;
};

/**
 * Projects a vector tile point to the Spherical Mercator pixel space for a given zoom level.
 *
 * @param vecPt
 * @param tileX
 * @param tileY
 * @param extent
 * @param tileSize
 */
MVTFeature.prototype._project = function(vecPt, tileX, tileY, extent, tileSize) {
  var xOffset = tileX * tileSize;
  var yOffset = tileY * tileSize;
  return {
    x: Math.floor(vecPt.x + xOffset),
    y: Math.floor(vecPt.y + yOffset)
  };
};

/**
 * Takes a coordinate from a vector tile and turns it into a Leaflet Point.
 *
 * @param ctx
 * @param coords
 * @returns {eGeomType.Point}
 * @private
 */
MVTFeature.prototype._tilePoint = function(coords) {
  return new L.Point(coords.x / this.divisor, coords.y / this.divisor);
};

MVTFeature.prototype.linkedFeature = function() {
  var linkedLayer = this.mvtLayer.linkedLayer();
  if(linkedLayer){
    var linkedFeature = linkedLayer.features[this.id];
    return linkedFeature;
  }else{
    return null;
  }
};


},{"./MVTUtil":"/Users/xudongliu/leaflet-mvt/src/MVTUtil.js","./StaticLabel/StaticLabel.js":"/Users/xudongliu/leaflet-mvt/src/StaticLabel/StaticLabel.js"}],"/Users/xudongliu/leaflet-mvt/src/MVTLayer.js":[function(require,module,exports){
/**
 * Created by Ryan Whitley on 5/17/14.
 */
/** Forked from https://gist.github.com/DGuidi/1716010 **/
var MVTFeature = require('./MVTFeature');
var Util = require('./MVTUtil');

module.exports = L.TileLayer.Canvas.extend({

  options: {
    debug: false,
    isHiddenLayer: false,
    getIDForLayerFeature: function() {},
    tileSize: 256,
    lineClickTolerance: 2
  },

  _featureIsClicked: {},

  _isPointInPoly: function(pt, poly) {
    if(poly && poly.length) {
      for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
      return c;
    }
  },

  _getDistanceFromLine: function(pt, pts) {
    var min = Number.POSITIVE_INFINITY;
    if (pts && pts.length > 1) {
      pt = L.point(pt.x, pt.y);
      for (var i = 0, l = pts.length - 1; i < l; i++) {
        var test = this._projectPointOnLineSegment(pt, pts[i], pts[i + 1]);
        if (test.distance <= min) {
          min = test.distance;
        }
      }
    }
    return min;
  },

  _projectPointOnLineSegment: function(p, r0, r1) {
    var lineLength = r0.distanceTo(r1);
    if (lineLength < 1) {
        return {distance: p.distanceTo(r0), coordinate: r0};
    }
    var u = ((p.x - r0.x) * (r1.x - r0.x) + (p.y - r0.y) * (r1.y - r0.y)) / Math.pow(lineLength, 2);
    if (u < 0.0000001) {
        return {distance: p.distanceTo(r0), coordinate: r0};
    }
    if (u > 0.9999999) {
        return {distance: p.distanceTo(r1), coordinate: r1};
    }
    var a = L.point(r0.x + u * (r1.x - r0.x), r0.y + u * (r1.y - r0.y));
    return {distance: p.distanceTo(a), point: a};
  },

  initialize: function(mvtSource, options) {
    var self = this;
    self.mvtSource = mvtSource;
    L.Util.setOptions(this, options);

    this.style = options.style;
    this.name = options.name;
    this._canvasIDToFeatures = {};
    this.features = {};
    this.featuresWithLabels = [];
    this._highestCount = 0;
  },

  onAdd: function(map) {
    var self = this;
    self.map = map;
    L.TileLayer.Canvas.prototype.onAdd.call(this, map);
    map.on('layerremove', function(e) {
      // we only want to do stuff when the layerremove event is on this layer
      if (e.layer._leaflet_id === self._leaflet_id) {
        removeLabels(self);
      }
    });
  },

  drawTile: function(canvas, tilePoint, zoom) {

    var ctx = {
      canvas: canvas,
      tile: tilePoint,
      zoom: zoom,
      tileSize: this.options.tileSize
    };

    ctx.id = Util.getContextID(ctx);

    if (!this._canvasIDToFeatures[ctx.id]) {
      this._initializeFeaturesHash(ctx);
    }
    if (!this.features) {
      this.features = {};
    }

  },

  _initializeFeaturesHash: function(ctx){
    this._canvasIDToFeatures[ctx.id] = {};
    this._canvasIDToFeatures[ctx.id].features = [];
    this._canvasIDToFeatures[ctx.id].canvas = ctx.canvas;
  },

  _draw: function(ctx) {
    //Draw is handled by the parent MVTSource object
  },
  getCanvas: function(parentCtx){
    //This gets called if a vector tile feature has already been parsed.
    //We've already got the geom, just get on with the drawing.
    //Need a way to pluck a canvas element from this layer given the parent layer's id.
    //Wait for it to get loaded before proceeding.
    var tilePoint = parentCtx.tile;
    var ctx = this._tiles[tilePoint.x + ":" + tilePoint.y];

    if(ctx){
      parentCtx.canvas = ctx;
      this.redrawTile(parentCtx.id);
      return;
    }

    var self = this;

    //This is a timer that will wait for a criterion to return true.
    //If not true within the timeout duration, it will move on.
    waitFor(function () {
        ctx = self._tiles[tilePoint.x + ":" + tilePoint.y];
        if(ctx) {
          return true;
        }
      },
      function(){
        //When it finishes, do this.
        ctx = self._tiles[tilePoint.x + ":" + tilePoint.y];
        parentCtx.canvas = ctx;
        self.redrawTile(parentCtx.id);

      }, //when done, go to next flow
      2000); //The Timeout milliseconds.  After this, give up and move on

  },

  parseVectorTileLayer: function(vtl, ctx) {
    var self = this;
    var tilePoint = ctx.tile;
    var layerCtx  = { canvas: null, id: ctx.id, tile: ctx.tile, zoom: ctx.zoom, tileSize: ctx.tileSize};

    //See if we can pluck the child tile from this PBF tile layer based on the master layer's tile id.
    layerCtx.canvas = self._tiles[tilePoint.x + ":" + tilePoint.y];



    //Initialize this tile's feature storage hash, if it hasn't already been created.  Used for when filters are updated, and features are cleared to prepare for a fresh redraw.
    if (!this._canvasIDToFeatures[layerCtx.id]) {
      this._initializeFeaturesHash(layerCtx);
    }else{
      //Clear this tile's previously saved features.
      this.clearTileFeatureHash(layerCtx.id);
    }

    var features = vtl.parsedFeatures;
    for (var i = 0, len = features.length; i < len; i++) {
      var vtf = features[i]; //vector tile feature
      vtf.layer = vtl;

      /**
       * Apply filter on feature if there is one. Defined in the options object
       * of TileLayer.MVTSource.js
       */
      var filter = self.options.filter;
      if (typeof filter === 'function') {
        if ( filter(vtf, layerCtx) === false ) continue;
      }

      var getIDForLayerFeature;
      if (typeof self.options.getIDForLayerFeature === 'function') {
        getIDForLayerFeature = self.options.getIDForLayerFeature;
      } else {
        getIDForLayerFeature = Util.getIDForLayerFeature;
      }
      var uniqueID = self.options.getIDForLayerFeature(vtf) || i;
      var mvtFeature = self.features[uniqueID];

      /**
       * Use layerOrdering function to apply a zIndex property to each vtf.  This is defined in
       * TileLayer.MVTSource.js.  Used below to sort features.npm
       */
      var layerOrdering = self.options.layerOrdering;
      if (typeof layerOrdering === 'function') {
        layerOrdering(vtf, layerCtx); //Applies a custom property to the feature, which is used after we're thru iterating to sort
      }

      //Create a new MVTFeature if one doesn't already exist for this feature.
      if (!mvtFeature) {
        //Get a style for the feature - set it just once for each new MVTFeature
        var style = self.style(vtf);

        //create a new feature
        self.features[uniqueID] = mvtFeature = new MVTFeature(self, vtf, layerCtx, uniqueID, style);
        if (style && style.dynamicLabel && typeof style.dynamicLabel === 'function') {
          self.featuresWithLabels.push(mvtFeature);
        }
      } else {
        //Add the new part to the existing feature
        mvtFeature.addTileFeature(vtf, layerCtx);
      }

      //Associate & Save this feature with this tile for later
      if(layerCtx && layerCtx.id) self._canvasIDToFeatures[layerCtx.id]['features'].push(mvtFeature);

    }

    /**
     * Apply sorting (zIndex) on feature if there is a function defined in the options object
     * of TileLayer.MVTSource.js
     */
    var layerOrdering = self.options.layerOrdering;
    if (layerOrdering) {
      //We've assigned the custom zIndex property when iterating above.  Now just sort.
      self._canvasIDToFeatures[layerCtx.id].features = self._canvasIDToFeatures[layerCtx.id].features.sort(function(a, b) {
        return -(b.properties.zIndex - a.properties.zIndex)
      });
    }

    self.redrawTile(layerCtx.id);
  },

  setStyle: function(styleFn) {
    // refresh the number for the highest count value
    // this is used only for choropleth
    this._highestCount = 0;

    // lowest count should not be 0, since we want to figure out the lowest
    this._lowestCount = null;

    this.style = styleFn;
    for (var key in this.features) {
      var feat = this.features[key];
      feat.setStyle(styleFn);
    }
    var z = this.map.getZoom();
    for (var key in this._tiles) {
      var id = z + ':' + key;
      this.redrawTile(id);
    }
  },

  /**
   * As counts for choropleths come in with the ajax data,
   * we want to keep track of which value is the highest
   * to create the color ramp for the fills of polygons.
   * @param count
   */
  setHighestCount: function(count) {
    if (count > this._highestCount) {
      this._highestCount = count;
    }
  },

  /**
   * Returns the highest number of all of the counts that have come in
   * from setHighestCount. This is assumed to be set via ajax callbacks.
   * @returns {number}
   */
  getHighestCount: function() {
    return this._highestCount;
  },

  setLowestCount: function(count) {
    if (!this._lowestCount || count < this._lowestCount) {
      this._lowestCount = count;
    }
  },

  getLowestCount: function() {
    return this._lowestCount;
  },

  setCountRange: function(count) {
    this.setHighestCount(count);
    this.setLowestCount(count);
  },

  //This is the old way.  It works, but is slow for mouseover events.  Fine for click events.
  handleClickEvent: function(evt, cb) {
    //Click happened on the GroupLayer (Manager) and passed it here
    var tileID = evt.tileID.split(":").slice(1, 3).join(":");
    var zoom = evt.tileID.split(":")[0];
    var canvas = this._tiles[tileID];
    if(!canvas) (cb(evt)); //break out
    var x = evt.layerPoint.x - canvas._leaflet_pos.x;
    var y = evt.layerPoint.y - canvas._leaflet_pos.y;

    var tilePoint = {x: x, y: y};
    var features = this._canvasIDToFeatures[evt.tileID].features;

    var minDistance = Number.POSITIVE_INFINITY;
    var nearest = null;
    var j, paths, distance;

    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      switch (feature.type) {

        case 1: //Point - currently rendered as circular paths.  Intersect with that.

          //Find the radius of the point.
          var radius = 3;
          if (typeof feature.style.radius === 'function') {
            radius = feature.style.radius(zoom); //Allows for scale dependent rednering
          }
          else{
            radius = feature.style.radius;
          }

          paths = feature.getPathsForTile(evt.tileID);
          for (j = 0; j < paths.length; j++) {
            //Builds a circle of radius feature.style.radius (assuming circular point symbology).
            if(in_circle(paths[j][0].x, paths[j][0].y, radius, x, y)){
              nearest = feature;
              minDistance = 0;
            }
          }
          break;

        case 2: //LineString
          paths = feature.getPathsForTile(evt.tileID);
          for (j = 0; j < paths.length; j++) {
            if (feature.style) {
              var distance = this._getDistanceFromLine(tilePoint, paths[j]);
              var thickness = (feature.selected && feature.style.selected ? feature.style.selected.size : feature.style.size);
              if (distance < thickness / 2 + this.options.lineClickTolerance && distance < minDistance) {
                nearest = feature;
                minDistance = distance;
              }
            }
          }
          break;

        case 3: //Polygon
          paths = feature.getPathsForTile(evt.tileID);
          for (j = 0; j < paths.length; j++) {
            if (this._isPointInPoly(tilePoint, paths[j])) {
              nearest = feature;
              minDistance = 0; // point is inside the polygon, so distance is zero
            }
          }
          break;
      }
      if (minDistance == 0) break;
    }

    if (nearest && nearest.toggleEnabled) {
        nearest.toggle();
    }
    evt.feature = nearest;
    cb(evt);
  },

  clearTile: function(id) {
    //id is the entire zoom:x:y.  we just want x:y.
    var ca = id.split(":");
    var canvasId = ca[1] + ":" + ca[2];
    if (typeof this._tiles[canvasId] === 'undefined') {
      console.error("typeof this._tiles[canvasId] === 'undefined'");
      return;
    }
    var canvas = this._tiles[canvasId];

    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  },

  clearTileFeatureHash: function(canvasID){
    this._canvasIDToFeatures[canvasID] = { features: []}; //Get rid of all saved features
  },

  clearLayerFeatureHash: function(){
    this.features = {};
  },

  redrawTile: function(canvasID) {
    //First, clear the canvas
    this.clearTile(canvasID);

    // If the features are not in the tile, then there is nothing to redraw.
    // This may happen if you call redraw before features have loaded and initially
    // drawn the tile.
    var featfeats = this._canvasIDToFeatures[canvasID];
    if (!featfeats) {
      return;
    }

    //Get the features for this tile, and redraw them.
    var features = featfeats.features;

    // we want to skip drawing the selected features and draw them last
    var selectedFeatures = [];

    // drawing all of the non-selected features
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      if (feature.selected) {
        selectedFeatures.push(feature);
      } else {
        feature.draw(canvasID);
      }
    }

    // drawing the selected features last
    for (var j = 0, len2 = selectedFeatures.length; j < len2; j++) {
      var selFeat = selectedFeatures[j];
      selFeat.draw(canvasID);
    }
  },

  _resetCanvasIDToFeatures: function(canvasID, canvas) {

    this._canvasIDToFeatures[canvasID] = {};
    this._canvasIDToFeatures[canvasID].features = [];
    this._canvasIDToFeatures[canvasID].canvas = canvas;

  },

  linkedLayer: function() {
    if(this.mvtSource.layerLink) {
      var linkName = this.mvtSource.layerLink(this.name);
      return this.mvtSource.layers[linkName];
    }
    else{
      return null;
    }
  },

  featureWithLabelAdded: function(feature) {
    this.featuresWithLabels.push(feature);
  }

});


function removeLabels(self) {
  var features = self.featuresWithLabels;
  for (var i = 0, len = features.length; i < len; i++) {
    var feat = features[i];
    feat.removeLabel();
  }
  self.featuresWithLabels = [];
}

function in_circle(center_x, center_y, radius, x, y) {
  var square_dist = Math.pow((center_x - x), 2) + Math.pow((center_y - y), 2);
  return square_dist <= Math.pow(radius, 2);
}
/**
 * See https://github.com/ariya/phantomjs/blob/master/examples/waitfor.js
 *
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
    start = new Date().getTime(),
    condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()), //< defensive code
    interval = setInterval(function () {
      if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
        // If not time-out yet and condition not yet fulfilled
        condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
      } else {
        if (!condition) {
          // If condition still not fulfilled (timeout but condition is 'false')
          console.log("'waitFor()' timeout");
          clearInterval(interval); //< Stop this interval
          typeof (onReady) === "string" ? eval(onReady) : onReady('timeout'); //< Do what it's supposed to do once the condition is fulfilled
        } else {
          // Condition fulfilled (timeout and/or condition is 'true')
          console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
          clearInterval(interval); //< Stop this interval
          typeof (onReady) === "string" ? eval(onReady) : onReady('success'); //< Do what it's supposed to do once the condition is fulfilled
        }
      }
    }, 50); //< repeat check every 50ms
};
},{"./MVTFeature":"/Users/xudongliu/leaflet-mvt/src/MVTFeature.js","./MVTUtil":"/Users/xudongliu/leaflet-mvt/src/MVTUtil.js"}],"/Users/xudongliu/leaflet-mvt/src/MVTSource.js":[function(require,module,exports){
var VectorTile = require('vector-tile').VectorTile;
var Protobuf = require('pbf');
var Point = require('point-geometry');
var Util = require('./MVTUtil');
var MVTLayer = require('./MVTLayer');


module.exports = L.TileLayer.MVTSource = L.TileLayer.Canvas.extend({

  options: {
    debug: false,
    url: "", //URL TO Vector Tile Source,
    getIDForLayerFeature: function() {},
    tileSize: 256,
    visibleLayers: []
  },
  layers: {}, //Keep a list of the layers contained in the PBFs
  processedTiles: {}, //Keep a list of tiles that have been processed already
  _eventHandlers: {},
  _triggerOnTilesLoadedEvent: true, //whether or not to fire the onTilesLoaded event when all of the tiles finish loading.
  _url: "", //internal URL property

  style: function(feature) {
    var style = {};

    var type = feature.type;
    switch (type) {
      case 1: //'Point'
        style.color = 'rgba(49,79,79,1)';
        style.radius = 5;
        style.selected = {
          color: 'rgba(255,255,0,0.5)',
          radius: 6
        };
        break;
      case 2: //'LineString'
        style.color = 'rgba(161,217,155,0.8)';
        style.size = 3;
        style.selected = {
          color: 'rgba(255,25,0,0.5)',
          size: 4
        };
        break;
      case 3: //'Polygon'
        style.color = 'rgba(49,79,79,1)';
        style.outline = {
          color: 'rgba(161,217,155,0.8)',
          size: 1
        };
        style.selected = {
          color: 'rgba(255,140,0,0.3)',
          outline: {
            color: 'rgba(255,140,0,1)',
            size: 2
          }
        };
        break;
    }
    return style;
  },


  initialize: function(options) {
    L.Util.setOptions(this, options);

    //a list of the layers contained in the PBFs
    this.layers = {};

    // tiles currently in the viewport
    this.activeTiles = {};

    // thats that have been loaded and drawn
    this.loadedTiles = {};

    this._url = this.options.url;

    /**
     * For some reason, Leaflet has some code that resets the
     * z index in the options object. I'm having trouble tracking
     * down exactly what does this and why, so for now, we should
     * just copy the value to this.zIndex so we can have the right
     * number when we make the subsequent MVTLayers.
     */
    this.zIndex = options.zIndex;

    if (typeof options.style === 'function') {
      this.style = options.style;
    }

    if (typeof options.ajaxSource === 'function') {
      this.ajaxSource = options.ajaxSource;
    }

    this.layerLink = options.layerLink;

    this._eventHandlers = {};

    this._tilesToProcess = 0; //store the max number of tiles to be loaded.  Later, we can use this count to count down PBF loading.
  },

  redraw: function(triggerOnTilesLoadedEvent){
    //Only set to false if it actually is passed in as 'false'
    if (triggerOnTilesLoadedEvent === false) {
      this._triggerOnTilesLoadedEvent = false;
    }

    L.TileLayer.Canvas.prototype.redraw.call(this);
  },

  onAdd: function(map) {
    var self = this;
    self.map = map;
    L.TileLayer.Canvas.prototype.onAdd.call(this, map);

    var mapOnClickCallback = function(e) {
      self._onClick(e);
    };

    map.on('click', mapOnClickCallback);

    map.on("layerremove", function(e) {
      // check to see if the layer removed is this one
      // call a method to remove the child layers (the ones that actually have something drawn on them).
      if (e.layer._leaflet_id === self._leaflet_id && e.layer.removeChildLayers) {
        e.layer.removeChildLayers(map);
        map.off('click', mapOnClickCallback);
      }
    });

    self.addChildLayers(map);

    if (typeof DynamicLabel === 'function' ) {
      this.dynamicLabel = new DynamicLabel(map, this, {});
    }

  },

  drawTile: function(canvas, tilePoint, zoom) {
    var ctx = {
      id: [zoom, tilePoint.x, tilePoint.y].join(":"),
      canvas: canvas,
      tile: tilePoint,
      zoom: zoom,
      tileSize: this.options.tileSize
    };

    //Capture the max number of the tiles to load here. this._tilesToProcess is an internal number we use to know when we've finished requesting PBFs.
    if(this._tilesToProcess < this._tilesToLoad) this._tilesToProcess = this._tilesToLoad;

    var id = ctx.id = Util.getContextID(ctx);
    this.activeTiles[id] = ctx;

    if(!this.processedTiles[ctx.zoom]) this.processedTiles[ctx.zoom] = {};

    if (this.options.debug) {
      this._drawDebugInfo(ctx);
    }
    this._draw(ctx);
  },

  setOpacity:function(opacity) {
    this._setVisibleLayersStyle('opacity',opacity);
  },

  setZIndex:function(zIndex) {
    this._setVisibleLayersStyle('zIndex',zIndex);
  },

  _setVisibleLayersStyle:function(style, value) {
    for(var key in this.layers) {
      this.layers[key]._tileContainer.style[style] = value;
    }
  },

  _drawDebugInfo: function(ctx) {
    var max = this.options.tileSize;
    var g = ctx.canvas.getContext('2d');
    g.strokeStyle = '#000000';
    g.fillStyle = '#FFFF00';
    g.strokeRect(0, 0, max, max);
    g.font = "12px Arial";
    g.fillRect(0, 0, 5, 5);
    g.fillRect(0, max - 5, 5, 5);
    g.fillRect(max - 5, 0, 5, 5);
    g.fillRect(max - 5, max - 5, 5, 5);
    g.fillRect(max / 2 - 5, max / 2 - 5, 10, 10);
    g.strokeText(ctx.zoom + ' ' + ctx.tile.x + ' ' + ctx.tile.y, max / 2 - 30, max / 2 - 10);
  },

  _draw: function(ctx) {
    var self = this;

//    //This works to skip fetching and processing tiles if they've already been processed.
//    var vectorTile = this.processedTiles[ctx.zoom][ctx.id];
//    //if we've already parsed it, don't get it again.
//    if(vectorTile){
//      console.log("Skipping fetching " + ctx.id);
//      self.checkVectorTileLayers(parseVT(vectorTile), ctx, true);
//      self.reduceTilesToProcessCount();
//      return;
//    }

    if (!this._url) return;
    var src = this.getTileUrl({ x: ctx.tile.x, y: ctx.tile.y, z: ctx.zoom });

    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if (xhr.status == "200") {

        if(!xhr.response) return;

        var arrayBuffer = new Uint8Array(xhr.response);
        var buf = new Protobuf(arrayBuffer);
        var vt = new VectorTile(buf);
        //Check the current map layer zoom.  If fast zooming is occurring, then short circuit tiles that are for a different zoom level than we're currently on.
        if(self.map && self.map.getZoom() != ctx.zoom) {
          console.log("Fetched tile for zoom level " + ctx.zoom + ". Map is at zoom level " + self._map.getZoom());
          return;
        }
        self.checkVectorTileLayers(parseVT(vt), ctx);
        tileLoaded(self, ctx);
      }

      //either way, reduce the count of tilesToProcess tiles here
      self.reduceTilesToProcessCount();
    };

    xhr.onerror = function() {
      console.log("xhr error: " + xhr.status)
    };

    xhr.open('GET', src, true); //async is true
    xhr.responseType = 'arraybuffer';
    xhr.send();
  },

  reduceTilesToProcessCount: function(){
    this._tilesToProcess--;
    if(!this._tilesToProcess){
      //Trigger event letting us know that all PBFs have been loaded and processed (or 404'd).
      if(this._eventHandlers["PBFLoad"]) this._eventHandlers["PBFLoad"]();
      this._pbfLoaded();
    }
  },

  checkVectorTileLayers: function(vt, ctx, parsed) {
    var self = this;

    //Check if there are specified visible layers
    if(self.options.visibleLayers && self.options.visibleLayers.length > 0){
      //only let thru the layers listed in the visibleLayers array
      for(var i=0; i < self.options.visibleLayers.length; i++){
        var layerName = self.options.visibleLayers[i];
        if(vt.layers[layerName]){
           //Proceed with parsing
          self.prepareMVTLayers(vt.layers[layerName], layerName, ctx, parsed);
        }
      }
    }else{
      //Parse all vt.layers
      for (var key in vt.layers) {
        self.prepareMVTLayers(vt.layers[key], key, ctx, parsed);
      }
    }
  },

  prepareMVTLayers: function(lyr ,key, ctx, parsed) {
    var self = this;

    if (!self.layers[key]) {
      //Create MVTLayer or MVTPointLayer for user
      self.layers[key] = self.createMVTLayer(key, lyr.parsedFeatures[0].type || null);
    }

    if (parsed) {
      //We've already parsed it.  Go get canvas and draw.
      self.layers[key].getCanvas(ctx, lyr);
    } else {
      self.layers[key].parseVectorTileLayer(lyr, ctx);
    }

  },

  createMVTLayer: function(key, type) {
    var self = this;

    var getIDForLayerFeature;
    if (typeof self.options.getIDForLayerFeature === 'function') {
      getIDForLayerFeature = self.options.getIDForLayerFeature;
    } else {
      getIDForLayerFeature = Util.getIDForLayerFeature;
    }

    var options = {
      getIDForLayerFeature: getIDForLayerFeature,
      filter: self.options.filter,
      layerOrdering: self.options.layerOrdering,
      style: self.style,
      name: key,
      asynch: true
    };

    if (self.options.zIndex) {
      options.zIndex = self.zIndex;
    }

    //Take the layer and create a new MVTLayer or MVTPointLayer if one doesn't exist.
    var layer = new MVTLayer(self, options).addTo(self.map);

    return layer;
  },

  getLayers: function() {
    return this.layers;
  },

  hideLayer: function(id) {
    if (this.layers[id]) {
      this._map.removeLayer(this.layers[id]);
      if(this.options.visibleLayers.indexOf("id") > -1){
        this.visibleLayers.splice(this.options.visibleLayers.indexOf("id"), 1);
      }
    }
  },

  showLayer: function(id) {
    if (this.layers[id]) {
      this._map.addLayer(this.layers[id]);
      if(this.options.visibleLayers.indexOf("id") == -1){
        this.visibleLayers.push(id);
      }
    }
    //Make sure manager layer is always in front
    this.bringToFront();
  },

  removeChildLayers: function(map){
    //Remove child layers of this group layer
    for (var key in this.layers) {
      var layer = this.layers[key];
      map.removeLayer(layer);
    }
  },

  addChildLayers: function(map) {
    var self = this;
    if(self.options.visibleLayers.length > 0){
      //only let thru the layers listed in the visibleLayers array
      for(var i=0; i < self.options.visibleLayers.length; i++){
        var layerName = self.options.visibleLayers[i];
        var layer = this.layers[layerName];
        if(layer){
          //Proceed with parsing
          map.addLayer(layer);
        }
      }
    }else{
      //Add all layers
      for (var key in this.layers) {
        var layer = this.layers[key];
        // layer is set to visible and is not already on map
        if (!layer._map) {
          map.addLayer(layer);
        }
      }
    }
  },

  bind: function(eventType, callback) {
    this._eventHandlers[eventType] = callback;
  },

  _onClick: function(evt) {
    //Here, pass the event on to the child MVTLayer and have it do the hit test and handle the result.
    var self = this;
    var onClick = self.options.onClick;
    var clickableLayers = self.options.clickableLayers;
    var layers = self.layers;

    evt.tileID =  getTileURL(evt.latlng.lat, evt.latlng.lng, this.map.getZoom());

    // We must have an array of clickable layers, otherwise, we just pass
    // the event to the public onClick callback in options.

    if(!clickableLayers){
      clickableLayers = Object.keys(self.layers);
    }

    if (clickableLayers && clickableLayers.length > 0) {
      for (var i = 0, len = clickableLayers.length; i < len; i++) {
        var key = clickableLayers[i];
        var layer = layers[key];
        if (layer) {
          layer.handleClickEvent(evt, function(evt) {
            if (typeof onClick === 'function') {
              onClick(evt);
            }
          });
        }
      }
    } else {
      if (typeof onClick === 'function') {
        onClick(evt);
      }
    }

  },

  setFilter: function(filterFunction, layerName) {
    //take in a new filter function.
    //Propagate to child layers.

    //Add filter to all child layers if no layer is specified.
    for (var key in this.layers) {
      var layer = this.layers[key];

      if (layerName){
        if(key.toLowerCase() == layerName.toLowerCase()){
          layer.options.filter = filterFunction; //Assign filter to child layer, only if name matches
          //After filter is set, the old feature hashes are invalid.  Clear them for next draw.
          layer.clearLayerFeatureHash();
          //layer.clearTileFeatureHash();
        }
      }
      else{
        layer.options.filter = filterFunction; //Assign filter to child layer
        //After filter is set, the old feature hashes are invalid.  Clear them for next draw.
        layer.clearLayerFeatureHash();
        //layer.clearTileFeatureHash();
      }
    }
  },

  /**
   * Take in a new style function and propogate to child layers.
   * If you do not set a layer name, it resets the style for all of the layers.
   * @param styleFunction
   * @param layerName
   */
  setStyle: function(styleFn, layerName) {
    for (var key in this.layers) {
      var layer = this.layers[key];
      if (layerName) {
        if(key.toLowerCase() == layerName.toLowerCase()) {
          layer.setStyle(styleFn);
        }
      } else {
        layer.setStyle(styleFn);
      }
    }
  },

  featureSelected: function(mvtFeature) {
    if (this.options.mutexToggle) {
      if (this._selectedFeature) {
        this._selectedFeature.deselect();
      }
      this._selectedFeature = mvtFeature;
    }
    if (this.options.onSelect) {
      this.options.onSelect(mvtFeature);
    }
  },

  featureDeselected: function(mvtFeature) {
    if (this.options.mutexToggle && this._selectedFeature) {
      this._selectedFeature = null;
    }
    if (this.options.onDeselect) {
      this.options.onDeselect(mvtFeature);
    }
  },

  _pbfLoaded: function() {
    //Fires when all tiles from this layer have been loaded and drawn (or 404'd).

    //Make sure manager layer is always in front
    this.bringToFront();

    //See if there is an event to execute
    var self = this;
    var onTilesLoaded = self.options.onTilesLoaded;

    if (onTilesLoaded && typeof onTilesLoaded === 'function' && this._triggerOnTilesLoadedEvent === true) {
      onTilesLoaded(this);
    }
    self._triggerOnTilesLoadedEvent = true; //reset - if redraw() is called with the optinal 'false' parameter to temporarily disable the onTilesLoaded event from firing.  This resets it back to true after a single time of firing as 'false'.
  }

});


if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

function getTileURL(lat, lon, zoom) {
  var xtile = parseInt(Math.floor( (lon + 180) / 360 * (1<<zoom) ));
  var ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat.toRad()) + 1 / Math.cos(lat.toRad())) / Math.PI) / 2 * (1<<zoom) ));
  return "" + zoom + ":" + xtile + ":" + ytile;
}

function tileLoaded(pbfSource, ctx) {
  pbfSource.loadedTiles[ctx.id] = ctx;
}

function parseVT(vt){
  for (var key in vt.layers) {
    var lyr = vt.layers[key];
    parseVTFeatures(lyr);
  }
  return vt;
}

function parseVTFeatures(vtl){
  vtl.parsedFeatures = [];
  var features = vtl._features;
  for (var i = 0, len = features.length; i < len; i++) {
    var vtf = vtl.feature(i);
    vtf.coordinates = vtf.loadGeometry();
    vtl.parsedFeatures.push(vtf);
  }
  return vtl;
}

},{"./MVTLayer":"/Users/xudongliu/leaflet-mvt/src/MVTLayer.js","./MVTUtil":"/Users/xudongliu/leaflet-mvt/src/MVTUtil.js","pbf":"/Users/xudongliu/leaflet-mvt/node_modules/pbf/index.js","point-geometry":"/Users/xudongliu/leaflet-mvt/node_modules/point-geometry/index.js","vector-tile":"/Users/xudongliu/leaflet-mvt/node_modules/vector-tile/index.js"}],"/Users/xudongliu/leaflet-mvt/src/MVTUtil.js":[function(require,module,exports){
/**
 * Created by Nicholas Hallahan <nhallahan@spatialdev.com>
 *       on 8/15/14.
 */
var Util = module.exports = {};

Util.getContextID = function(ctx) {
  return [ctx.zoom, ctx.tile.x, ctx.tile.y].join(":");
};

/**
 * Default function that gets the id for a layer feature.
 * Sometimes this needs to be done in a different way and
 * can be specified by the user in the options for L.TileLayer.MVTSource.
 *
 * @param feature
 * @returns {ctx.id|*|id|string|jsts.index.chain.MonotoneChain.id|number}
 */
Util.getIDForLayerFeature = function(feature) {
  return feature.properties.id;
};

Util.getJSON = function(url, callback) {
  var xmlhttp = typeof XMLHttpRequest !== 'undefined' ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
  xmlhttp.onreadystatechange = function() {
    var status = xmlhttp.status;
    if (xmlhttp.readyState === 4 && status >= 200 && status < 300) {
      var json = JSON.parse(xmlhttp.responseText);
      callback(null, json);
    } else {
      callback( { error: true, status: status } );
    }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
};

},{}],"/Users/xudongliu/leaflet-mvt/src/StaticLabel/StaticLabel.js":[function(require,module,exports){
/**
 * Created by Nicholas Hallahan <nhallahan@spatialdev.com>
 *       on 7/31/14.
 */
var Util = require('../MVTUtil');
module.exports = StaticLabel;

function StaticLabel(mvtFeature, ctx, latLng, style) {
  var self = this;
  this.mvtFeature = mvtFeature;
  this.map = mvtFeature.map;
  this.zoom = ctx.zoom;
  this.latLng = latLng;
  this.selected = false;

  if (mvtFeature.linkedFeature) {
    var linkedFeature = mvtFeature.linkedFeature();
    if (linkedFeature && linkedFeature.selected) {
      self.selected = true;
    }
  }

  init(self, mvtFeature, ctx, latLng, style)
}

function init(self, mvtFeature, ctx, latLng, style) {
  var ajaxData = mvtFeature.ajaxData;
  var sty = self.style = style.staticLabel(mvtFeature, ajaxData);
  var icon = self.icon = L.divIcon({
    className: sty.cssClass || 'label-icon-text',
    html: sty.html,
    iconSize: sty.iconSize || [50,50]
  });

  self.marker = L.marker(latLng, {icon: icon}).addTo(self.map);

  if (self.selected) {
    self.marker._icon.classList.add(self.style.cssSelectedClass || 'label-icon-text-selected');
  }

  self.marker.on('click', function(e) {
    self.toggle();
  });

  self.map.on('zoomend', function(e) {
    var newZoom = e.target.getZoom();
    if (self.zoom !== newZoom) {
      self.map.removeLayer(self.marker);
    }
  });
}


StaticLabel.prototype.toggle = function() {
  if (this.selected) {
    this.deselect();
  } else {
    this.select();
  }
};

StaticLabel.prototype.select = function() {
  this.selected = true;
  this.marker._icon.classList.add(this.style.cssSelectedClass || 'label-icon-text-selected');
  var linkedFeature = this.mvtFeature.linkedFeature();
  if (!linkedFeature.selected) linkedFeature.select();
};

StaticLabel.prototype.deselect = function() {
  this.selected = false;
  this.marker._icon.classList.remove(this.style.cssSelectedClass || 'label-icon-text-selected');
  var linkedFeature = this.mvtFeature.linkedFeature();
  if (linkedFeature.selected) linkedFeature.deselect();
};

StaticLabel.prototype.remove = function() {
  if (!this.map || !this.marker) return;
  this.map.removeLayer(this.marker);
};

},{"../MVTUtil":"/Users/xudongliu/leaflet-mvt/src/MVTUtil.js"}],"/Users/xudongliu/leaflet-mvt/src/index.js":[function(require,module,exports){
/**
 * Copyright (c) 2014, Spatial Development International
 * All rights reserved.
 *
 * Source code can be found at:
 * https://github.com/SpatialServer/Leaflet.MapboxVectorTile
 *
 * @license ISC
 */

module.exports = require('./MVTSource');

},{"./MVTSource":"/Users/xudongliu/leaflet-mvt/src/MVTSource.js"}]},{},["/Users/xudongliu/leaflet-mvt/src/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveHVkb25nbGl1L2xlYWZsZXQtbXZ0L25vZGVfbW9kdWxlcy9wYmYvYnVmZmVyLmpzIiwiL1VzZXJzL3h1ZG9uZ2xpdS9sZWFmbGV0LW12dC9ub2RlX21vZHVsZXMvcGJmL2luZGV4LmpzIiwiL1VzZXJzL3h1ZG9uZ2xpdS9sZWFmbGV0LW12dC9ub2RlX21vZHVsZXMvcGJmL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiL1VzZXJzL3h1ZG9uZ2xpdS9sZWFmbGV0LW12dC9ub2RlX21vZHVsZXMvcG9pbnQtZ2VvbWV0cnkvaW5kZXguanMiLCIvVXNlcnMveHVkb25nbGl1L2xlYWZsZXQtbXZ0L25vZGVfbW9kdWxlcy92ZWN0b3ItdGlsZS9pbmRleC5qcyIsIi9Vc2Vycy94dWRvbmdsaXUvbGVhZmxldC1tdnQvbm9kZV9tb2R1bGVzL3ZlY3Rvci10aWxlL2xpYi92ZWN0b3J0aWxlLmpzIiwiL1VzZXJzL3h1ZG9uZ2xpdS9sZWFmbGV0LW12dC9ub2RlX21vZHVsZXMvdmVjdG9yLXRpbGUvbGliL3ZlY3RvcnRpbGVmZWF0dXJlLmpzIiwiL1VzZXJzL3h1ZG9uZ2xpdS9sZWFmbGV0LW12dC9ub2RlX21vZHVsZXMvdmVjdG9yLXRpbGUvbGliL3ZlY3RvcnRpbGVsYXllci5qcyIsIi9Vc2Vycy94dWRvbmdsaXUvbGVhZmxldC1tdnQvc3JjL01WVEZlYXR1cmUuanMiLCIvVXNlcnMveHVkb25nbGl1L2xlYWZsZXQtbXZ0L3NyYy9NVlRMYXllci5qcyIsIi9Vc2Vycy94dWRvbmdsaXUvbGVhZmxldC1tdnQvc3JjL01WVFNvdXJjZS5qcyIsIi9Vc2Vycy94dWRvbmdsaXUvbGVhZmxldC1tdnQvc3JjL01WVFV0aWwuanMiLCIvVXNlcnMveHVkb25nbGl1L2xlYWZsZXQtbXZ0L3NyYy9TdGF0aWNMYWJlbC9TdGF0aWNMYWJlbC5qcyIsIi9Vc2Vycy94dWRvbmdsaXUvbGVhZmxldC1tdnQvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOWdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuLy8gbGlnaHR3ZWlnaHQgQnVmZmVyIHNoaW0gZm9yIHBiZiBicm93c2VyIGJ1aWxkXG4vLyBiYXNlZCBvbiBjb2RlIGZyb20gZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyIChNSVQtbGljZW5zZWQpXG5cbm1vZHVsZS5leHBvcnRzID0gQnVmZmVyO1xuXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKTtcblxudmFyIEJ1ZmZlck1ldGhvZHM7XG5cbmZ1bmN0aW9uIEJ1ZmZlcihsZW5ndGgpIHtcbiAgICB2YXIgYXJyO1xuICAgIGlmIChsZW5ndGggJiYgbGVuZ3RoLmxlbmd0aCkge1xuICAgICAgICBhcnIgPSBsZW5ndGg7XG4gICAgICAgIGxlbmd0aCA9IGFyci5sZW5ndGg7XG4gICAgfVxuICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGggfHwgMCk7XG4gICAgaWYgKGFycikgYnVmLnNldChhcnIpO1xuXG4gICAgYnVmLnJlYWRVSW50MzJMRSA9IEJ1ZmZlck1ldGhvZHMucmVhZFVJbnQzMkxFO1xuICAgIGJ1Zi53cml0ZVVJbnQzMkxFID0gQnVmZmVyTWV0aG9kcy53cml0ZVVJbnQzMkxFO1xuICAgIGJ1Zi5yZWFkSW50MzJMRSA9IEJ1ZmZlck1ldGhvZHMucmVhZEludDMyTEU7XG4gICAgYnVmLndyaXRlSW50MzJMRSA9IEJ1ZmZlck1ldGhvZHMud3JpdGVJbnQzMkxFO1xuICAgIGJ1Zi5yZWFkRmxvYXRMRSA9IEJ1ZmZlck1ldGhvZHMucmVhZEZsb2F0TEU7XG4gICAgYnVmLndyaXRlRmxvYXRMRSA9IEJ1ZmZlck1ldGhvZHMud3JpdGVGbG9hdExFO1xuICAgIGJ1Zi5yZWFkRG91YmxlTEUgPSBCdWZmZXJNZXRob2RzLnJlYWREb3VibGVMRTtcbiAgICBidWYud3JpdGVEb3VibGVMRSA9IEJ1ZmZlck1ldGhvZHMud3JpdGVEb3VibGVMRTtcbiAgICBidWYudG9TdHJpbmcgPSBCdWZmZXJNZXRob2RzLnRvU3RyaW5nO1xuICAgIGJ1Zi53cml0ZSA9IEJ1ZmZlck1ldGhvZHMud3JpdGU7XG4gICAgYnVmLnNsaWNlID0gQnVmZmVyTWV0aG9kcy5zbGljZTtcbiAgICBidWYuY29weSA9IEJ1ZmZlck1ldGhvZHMuY29weTtcblxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlO1xuICAgIHJldHVybiBidWY7XG59XG5cbnZhciBsYXN0U3RyLCBsYXN0U3RyRW5jb2RlZDtcblxuQnVmZmVyTWV0aG9kcyA9IHtcbiAgICByZWFkVUludDMyTEU6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICByZXR1cm4gKCh0aGlzW3Bvc10pIHxcbiAgICAgICAgICAgICh0aGlzW3BvcyArIDFdIDw8IDgpIHxcbiAgICAgICAgICAgICh0aGlzW3BvcyArIDJdIDw8IDE2KSkgK1xuICAgICAgICAgICAgKHRoaXNbcG9zICsgM10gKiAweDEwMDAwMDApO1xuICAgIH0sXG5cbiAgICB3cml0ZVVJbnQzMkxFOiBmdW5jdGlvbih2YWwsIHBvcykge1xuICAgICAgICB0aGlzW3Bvc10gPSB2YWw7XG4gICAgICAgIHRoaXNbcG9zICsgMV0gPSAodmFsID4+PiA4KTtcbiAgICAgICAgdGhpc1twb3MgKyAyXSA9ICh2YWwgPj4+IDE2KTtcbiAgICAgICAgdGhpc1twb3MgKyAzXSA9ICh2YWwgPj4+IDI0KTtcbiAgICB9LFxuXG4gICAgcmVhZEludDMyTEU6IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICByZXR1cm4gKCh0aGlzW3Bvc10pIHxcbiAgICAgICAgICAgICh0aGlzW3BvcyArIDFdIDw8IDgpIHxcbiAgICAgICAgICAgICh0aGlzW3BvcyArIDJdIDw8IDE2KSkgK1xuICAgICAgICAgICAgKHRoaXNbcG9zICsgM10gPDwgMjQpO1xuICAgIH0sXG5cbiAgICByZWFkRmxvYXRMRTogIGZ1bmN0aW9uKHBvcykgeyByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIHBvcywgdHJ1ZSwgMjMsIDQpOyB9LFxuICAgIHJlYWREb3VibGVMRTogZnVuY3Rpb24ocG9zKSB7IHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgcG9zLCB0cnVlLCA1MiwgOCk7IH0sXG5cbiAgICB3cml0ZUZsb2F0TEU6ICBmdW5jdGlvbih2YWwsIHBvcykgeyByZXR1cm4gaWVlZTc1NC53cml0ZSh0aGlzLCB2YWwsIHBvcywgdHJ1ZSwgMjMsIDQpOyB9LFxuICAgIHdyaXRlRG91YmxlTEU6IGZ1bmN0aW9uKHZhbCwgcG9zKSB7IHJldHVybiBpZWVlNzU0LndyaXRlKHRoaXMsIHZhbCwgcG9zLCB0cnVlLCA1MiwgOCk7IH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgdmFyIHN0ciA9ICcnLFxuICAgICAgICAgICAgdG1wID0gJyc7XG5cbiAgICAgICAgc3RhcnQgPSBzdGFydCB8fCAwO1xuICAgICAgICBlbmQgPSBNYXRoLm1pbih0aGlzLmxlbmd0aCwgZW5kIHx8IHRoaXMubGVuZ3RoKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoID0gdGhpc1tpXTtcbiAgICAgICAgICAgIGlmIChjaCA8PSAweDdGKSB7XG4gICAgICAgICAgICAgICAgc3RyICs9IGRlY29kZVVSSUNvbXBvbmVudCh0bXApICsgU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7XG4gICAgICAgICAgICAgICAgdG1wID0gJyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRtcCArPSAnJScgKyBjaC50b1N0cmluZygxNik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdHIgKz0gZGVjb2RlVVJJQ29tcG9uZW50KHRtcCk7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9LFxuXG4gICAgd3JpdGU6IGZ1bmN0aW9uKHN0ciwgcG9zKSB7XG4gICAgICAgIHZhciBieXRlcyA9IHN0ciA9PT0gbGFzdFN0ciA/IGxhc3RTdHJFbmNvZGVkIDogZW5jb2RlU3RyaW5nKHN0cik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXNbcG9zICsgaV0gPSBieXRlc1tpXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKTtcbiAgICB9LFxuXG4gICAgY29weTogZnVuY3Rpb24oYnVmLCBwb3MpIHtcbiAgICAgICAgcG9zID0gcG9zIHx8IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYnVmW3BvcyArIGldID0gdGhpc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkJ1ZmZlck1ldGhvZHMud3JpdGVJbnQzMkxFID0gQnVmZmVyTWV0aG9kcy53cml0ZVVJbnQzMkxFO1xuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uKHN0cikge1xuICAgIGxhc3RTdHIgPSBzdHI7XG4gICAgbGFzdFN0ckVuY29kZWQgPSBlbmNvZGVTdHJpbmcoc3RyKTtcbiAgICByZXR1cm4gbGFzdFN0ckVuY29kZWQubGVuZ3RoO1xufTtcblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24oYnVmKSB7XG4gICAgcmV0dXJuICEhKGJ1ZiAmJiBidWYuX2lzQnVmZmVyKTtcbn07XG5cbmZ1bmN0aW9uIGVuY29kZVN0cmluZyhzdHIpIHtcbiAgICB2YXIgbGVuZ3RoID0gc3RyLmxlbmd0aCxcbiAgICAgICAgYnl0ZXMgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBjLCBsZWFkOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpOyAvLyBjb2RlIHBvaW50XG5cbiAgICAgICAgaWYgKGMgPiAweEQ3RkYgJiYgYyA8IDB4RTAwMCkge1xuXG4gICAgICAgICAgICBpZiAobGVhZCkge1xuICAgICAgICAgICAgICAgIGlmIChjIDwgMHhEQzAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRCk7XG4gICAgICAgICAgICAgICAgICAgIGxlYWQgPSBjO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGMgPSBsZWFkIC0gMHhEODAwIDw8IDEwIHwgYyAtIDB4REMwMCB8IDB4MTAwMDA7XG4gICAgICAgICAgICAgICAgICAgIGxlYWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYyA+IDB4REJGRiB8fCAoaSArIDEgPT09IGxlbmd0aCkpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRCk7XG4gICAgICAgICAgICAgICAgZWxzZSBsZWFkID0gYztcblxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSBpZiAobGVhZCkge1xuICAgICAgICAgICAgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKTtcbiAgICAgICAgICAgIGxlYWQgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwKSBieXRlcy5wdXNoKGMpO1xuICAgICAgICBlbHNlIGlmIChjIDwgMHg4MDApIGJ5dGVzLnB1c2goYyA+PiAweDYgfCAweEMwLCBjICYgMHgzRiB8IDB4ODApO1xuICAgICAgICBlbHNlIGlmIChjIDwgMHgxMDAwMCkgYnl0ZXMucHVzaChjID4+IDB4QyB8IDB4RTAsIGMgPj4gMHg2ICYgMHgzRiB8IDB4ODAsIGMgJiAweDNGIHwgMHg4MCk7XG4gICAgICAgIGVsc2UgYnl0ZXMucHVzaChjID4+IDB4MTIgfCAweEYwLCBjID4+IDB4QyAmIDB4M0YgfCAweDgwLCBjID4+IDB4NiAmIDB4M0YgfCAweDgwLCBjICYgMHgzRiB8IDB4ODApO1xuICAgIH1cbiAgICByZXR1cm4gYnl0ZXM7XG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gUGJmO1xuXG52YXIgQnVmZmVyID0gZ2xvYmFsLkJ1ZmZlciB8fCByZXF1aXJlKCcuL2J1ZmZlcicpO1xuXG5mdW5jdGlvbiBQYmYoYnVmKSB7XG4gICAgdGhpcy5idWYgPSAhQnVmZmVyLmlzQnVmZmVyKGJ1ZikgPyBuZXcgQnVmZmVyKGJ1ZiB8fCAwKSA6IGJ1ZjtcbiAgICB0aGlzLnBvcyA9IDA7XG4gICAgdGhpcy5sZW5ndGggPSB0aGlzLmJ1Zi5sZW5ndGg7XG59XG5cblBiZi5WYXJpbnQgID0gMDsgLy8gdmFyaW50OiBpbnQzMiwgaW50NjQsIHVpbnQzMiwgdWludDY0LCBzaW50MzIsIHNpbnQ2NCwgYm9vbCwgZW51bVxuUGJmLkZpeGVkNjQgPSAxOyAvLyA2NC1iaXQ6IGRvdWJsZSwgZml4ZWQ2NCwgc2ZpeGVkNjRcblBiZi5CeXRlcyAgID0gMjsgLy8gbGVuZ3RoLWRlbGltaXRlZDogc3RyaW5nLCBieXRlcywgZW1iZWRkZWQgbWVzc2FnZXMsIHBhY2tlZCByZXBlYXRlZCBmaWVsZHNcblBiZi5GaXhlZDMyID0gNTsgLy8gMzItYml0OiBmbG9hdCwgZml4ZWQzMiwgc2ZpeGVkMzJcblxudmFyIFNISUZUX0xFRlRfMzIgPSAoMSA8PCAxNikgKiAoMSA8PCAxNiksXG4gICAgU0hJRlRfUklHSFRfMzIgPSAxIC8gU0hJRlRfTEVGVF8zMixcbiAgICBQT1dfMl82MyA9IE1hdGgucG93KDIsIDYzKTtcblxuUGJmLnByb3RvdHlwZSA9IHtcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmJ1ZiA9IG51bGw7XG4gICAgfSxcblxuICAgIC8vID09PSBSRUFESU5HID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICByZWFkRmllbGRzOiBmdW5jdGlvbihyZWFkRmllbGQsIHJlc3VsdCwgZW5kKSB7XG4gICAgICAgIGVuZCA9IGVuZCB8fCB0aGlzLmxlbmd0aDtcblxuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSB0aGlzLnJlYWRWYXJpbnQoKSxcbiAgICAgICAgICAgICAgICB0YWcgPSB2YWwgPj4gMyxcbiAgICAgICAgICAgICAgICBzdGFydFBvcyA9IHRoaXMucG9zO1xuXG4gICAgICAgICAgICByZWFkRmllbGQodGFnLCByZXN1bHQsIHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPT09IHN0YXJ0UG9zKSB0aGlzLnNraXAodmFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICByZWFkTWVzc2FnZTogZnVuY3Rpb24ocmVhZEZpZWxkLCByZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhZEZpZWxkcyhyZWFkRmllbGQsIHJlc3VsdCwgdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcyk7XG4gICAgfSxcblxuICAgIHJlYWRGaXhlZDMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmLnJlYWRVSW50MzJMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWRTRml4ZWQzMjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1Zi5yZWFkSW50MzJMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIDY0LWJpdCBpbnQgaGFuZGxpbmcgaXMgYmFzZWQgb24gZ2l0aHViLmNvbS9kcHcvbm9kZS1idWZmZXItbW9yZS1pbnRzIChNSVQtbGljZW5zZWQpXG5cbiAgICByZWFkRml4ZWQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1Zi5yZWFkVUludDMyTEUodGhpcy5wb3MpICsgdGhpcy5idWYucmVhZFVJbnQzMkxFKHRoaXMucG9zICsgNCkgKiBTSElGVF9MRUZUXzMyO1xuICAgICAgICB0aGlzLnBvcyArPSA4O1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICByZWFkU0ZpeGVkNjQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWYucmVhZFVJbnQzMkxFKHRoaXMucG9zKSArIHRoaXMuYnVmLnJlYWRJbnQzMkxFKHRoaXMucG9zICsgNCkgKiBTSElGVF9MRUZUXzMyO1xuICAgICAgICB0aGlzLnBvcyArPSA4O1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICByZWFkRmxvYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy5idWYucmVhZEZsb2F0TEUodGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICByZWFkRG91YmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmLnJlYWREb3VibGVMRSh0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIHJlYWRWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnVmID0gdGhpcy5idWYsXG4gICAgICAgICAgICB2YWwsIGIsIGIwLCBiMSwgYjIsIGIzO1xuXG4gICAgICAgIGIwID0gYnVmW3RoaXMucG9zKytdOyBpZiAoYjAgPCAweDgwKSByZXR1cm4gYjA7ICAgICAgICAgICAgICAgICBiMCA9IGIwICYgMHg3ZjtcbiAgICAgICAgYjEgPSBidWZbdGhpcy5wb3MrK107IGlmIChiMSA8IDB4ODApIHJldHVybiBiMCB8IGIxIDw8IDc7ICAgICAgIGIxID0gKGIxICYgMHg3ZikgPDwgNztcbiAgICAgICAgYjIgPSBidWZbdGhpcy5wb3MrK107IGlmIChiMiA8IDB4ODApIHJldHVybiBiMCB8IGIxIHwgYjIgPDwgMTQ7IGIyID0gKGIyICYgMHg3ZikgPDwgMTQ7XG4gICAgICAgIGIzID0gYnVmW3RoaXMucG9zKytdOyBpZiAoYjMgPCAweDgwKSByZXR1cm4gYjAgfCBiMSB8IGIyIHwgYjMgPDwgMjE7XG5cbiAgICAgICAgdmFsID0gYjAgfCBiMSB8IGIyIHwgKGIzICYgMHg3ZikgPDwgMjE7XG5cbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDEwMDAwMDAwOyAgICAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDgwMDAwMDAwMDsgICAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDQwMDAwMDAwMDAwOyAgICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDIwMDAwMDAwMDAwMDA7ICAgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDEwMDAwMDAwMDAwMDAwMDsgIGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcbiAgICAgICAgYiA9IGJ1Zlt0aGlzLnBvcysrXTsgdmFsICs9IChiICYgMHg3ZikgKiAweDgwMDAwMDAwMDAwMDAwMDA7IGlmIChiIDwgMHg4MCkgcmV0dXJuIHZhbDtcblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHZhcmludCBub3QgbW9yZSB0aGFuIDEwIGJ5dGVzJyk7XG4gICAgfSxcblxuICAgIHJlYWRWYXJpbnQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGFydFBvcyA9IHRoaXMucG9zLFxuICAgICAgICAgICAgdmFsID0gdGhpcy5yZWFkVmFyaW50KCk7XG5cbiAgICAgICAgaWYgKHZhbCA8IFBPV18yXzYzKSByZXR1cm4gdmFsO1xuXG4gICAgICAgIHZhciBwb3MgPSB0aGlzLnBvcyAtIDI7XG4gICAgICAgIHdoaWxlICh0aGlzLmJ1Zltwb3NdID09PSAweGZmKSBwb3MtLTtcbiAgICAgICAgaWYgKHBvcyA8IHN0YXJ0UG9zKSBwb3MgPSBzdGFydFBvcztcblxuICAgICAgICB2YWwgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvcyAtIHN0YXJ0UG9zICsgMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYiA9IH50aGlzLmJ1ZltzdGFydFBvcyArIGldICYgMHg3ZjtcbiAgICAgICAgICAgIHZhbCArPSBpIDwgNCA/IGIgPDwgaSAqIDcgOiBiICogTWF0aC5wb3coMiwgaSAqIDcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC12YWwgLSAxO1xuICAgIH0sXG5cbiAgICByZWFkU1ZhcmludDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBudW0gPSB0aGlzLnJlYWRWYXJpbnQoKTtcbiAgICAgICAgcmV0dXJuIG51bSAlIDIgPT09IDEgPyAobnVtICsgMSkgLyAtMiA6IG51bSAvIDI7IC8vIHppZ3phZyBlbmNvZGluZ1xuICAgIH0sXG5cbiAgICByZWFkQm9vbGVhbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKHRoaXMucmVhZFZhcmludCgpKTtcbiAgICB9LFxuXG4gICAgcmVhZFN0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLFxuICAgICAgICAgICAgc3RyID0gdGhpcy5idWYudG9TdHJpbmcoJ3V0ZjgnLCB0aGlzLnBvcywgZW5kKTtcbiAgICAgICAgdGhpcy5wb3MgPSBlbmQ7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfSxcblxuICAgIHJlYWRCeXRlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLFxuICAgICAgICAgICAgYnVmZmVyID0gdGhpcy5idWYuc2xpY2UodGhpcy5wb3MsIGVuZCk7XG4gICAgICAgIHRoaXMucG9zID0gZW5kO1xuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH0sXG5cbiAgICAvLyB2ZXJib3NlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zOyBkb2Vzbid0IGFmZmVjdCBnemlwcGVkIHNpemVcblxuICAgIHJlYWRQYWNrZWRWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkVmFyaW50KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG4gICAgcmVhZFBhY2tlZFNWYXJpbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkU1ZhcmludCgpKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuICAgIHJlYWRQYWNrZWRCb29sZWFuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZEJvb2xlYW4oKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRmxvYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkRmxvYXQoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRG91YmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZERvdWJsZSgpKTtcbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuICAgIHJlYWRQYWNrZWRGaXhlZDMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZEZpeGVkMzIoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkU0ZpeGVkMzI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZW5kID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcywgYXJyID0gW107XG4gICAgICAgIHdoaWxlICh0aGlzLnBvcyA8IGVuZCkgYXJyLnB1c2godGhpcy5yZWFkU0ZpeGVkMzIoKSk7XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcbiAgICByZWFkUGFja2VkRml4ZWQ2NDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbmQgPSB0aGlzLnJlYWRWYXJpbnQoKSArIHRoaXMucG9zLCBhcnIgPSBbXTtcbiAgICAgICAgd2hpbGUgKHRoaXMucG9zIDwgZW5kKSBhcnIucHVzaCh0aGlzLnJlYWRGaXhlZDY0KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG4gICAgcmVhZFBhY2tlZFNGaXhlZDY0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVuZCA9IHRoaXMucmVhZFZhcmludCgpICsgdGhpcy5wb3MsIGFyciA9IFtdO1xuICAgICAgICB3aGlsZSAodGhpcy5wb3MgPCBlbmQpIGFyci5wdXNoKHRoaXMucmVhZFNGaXhlZDY0KCkpO1xuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG5cbiAgICBza2lwOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB2YWwgJiAweDc7XG4gICAgICAgIGlmICh0eXBlID09PSBQYmYuVmFyaW50KSB3aGlsZSAodGhpcy5idWZbdGhpcy5wb3MrK10gPiAweDdmKSB7fVxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBQYmYuQnl0ZXMpIHRoaXMucG9zID0gdGhpcy5yZWFkVmFyaW50KCkgKyB0aGlzLnBvcztcbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gUGJmLkZpeGVkMzIpIHRoaXMucG9zICs9IDQ7XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFBiZi5GaXhlZDY0KSB0aGlzLnBvcyArPSA4O1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcignVW5pbXBsZW1lbnRlZCB0eXBlOiAnICsgdHlwZSk7XG4gICAgfSxcblxuICAgIC8vID09PSBXUklUSU5HID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICB3cml0ZVRhZzogZnVuY3Rpb24odGFnLCB0eXBlKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQoKHRhZyA8PCAzKSB8IHR5cGUpO1xuICAgIH0sXG5cbiAgICByZWFsbG9jOiBmdW5jdGlvbihtaW4pIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHx8IDE2O1xuXG4gICAgICAgIHdoaWxlIChsZW5ndGggPCB0aGlzLnBvcyArIG1pbikgbGVuZ3RoICo9IDI7XG5cbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gdGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aCk7XG4gICAgICAgICAgICB0aGlzLmJ1Zi5jb3B5KGJ1Zik7XG4gICAgICAgICAgICB0aGlzLmJ1ZiA9IGJ1ZjtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5wb3M7XG4gICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVmLnNsaWNlKDAsIHRoaXMubGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgd3JpdGVGaXhlZDMyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZVVJbnQzMkxFKHZhbCwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgIH0sXG5cbiAgICB3cml0ZVNGaXhlZDMyOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy5yZWFsbG9jKDQpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZUludDMyTEUodmFsLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMucG9zICs9IDQ7XG4gICAgfSxcblxuICAgIHdyaXRlRml4ZWQ2NDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg4KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVJbnQzMkxFKHZhbCAmIC0xLCB0aGlzLnBvcyk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlVUludDMyTEUoTWF0aC5mbG9vcih2YWwgKiBTSElGVF9SSUdIVF8zMiksIHRoaXMucG9zICsgNCk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlU0ZpeGVkNjQ6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB0aGlzLnJlYWxsb2MoOCk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlSW50MzJMRSh2YWwgJiAtMSwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLmJ1Zi53cml0ZUludDMyTEUoTWF0aC5mbG9vcih2YWwgKiBTSElGVF9SSUdIVF8zMiksIHRoaXMucG9zICsgNCk7XG4gICAgICAgIHRoaXMucG9zICs9IDg7XG4gICAgfSxcblxuICAgIHdyaXRlVmFyaW50OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFsID0gK3ZhbDtcblxuICAgICAgICBpZiAodmFsIDw9IDB4N2YpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbGxvYygxKTtcbiAgICAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gdmFsO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodmFsIDw9IDB4M2ZmZikge1xuICAgICAgICAgICAgdGhpcy5yZWFsbG9jKDIpO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMCkgJiAweDdmKSB8IDB4ODA7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICgodmFsID4+PiA3KSAmIDB4N2YpO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodmFsIDw9IDB4MWZmZmZmKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxsb2MoMyk7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICgodmFsID4+PiAwKSAmIDB4N2YpIHwgMHg4MDtcbiAgICAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gKCh2YWwgPj4+IDcpICYgMHg3ZikgfCAweDgwO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMTQpICYgMHg3Zik7XG5cbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPD0gMHhmZmZmZmZmKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWxsb2MoNCk7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICgodmFsID4+PiAwKSAmIDB4N2YpIHwgMHg4MDtcbiAgICAgICAgICAgIHRoaXMuYnVmW3RoaXMucG9zKytdID0gKCh2YWwgPj4+IDcpICYgMHg3ZikgfCAweDgwO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMTQpICYgMHg3ZikgfCAweDgwO1xuICAgICAgICAgICAgdGhpcy5idWZbdGhpcy5wb3MrK10gPSAoKHZhbCA+Pj4gMjEpICYgMHg3Zik7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwb3MgPSB0aGlzLnBvcztcbiAgICAgICAgICAgIHdoaWxlICh2YWwgPj0gMHg4MCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVhbGxvYygxKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9ICh2YWwgJiAweGZmKSB8IDB4ODA7XG4gICAgICAgICAgICAgICAgdmFsIC89IDB4ODA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJlYWxsb2MoMSk7XG4gICAgICAgICAgICB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9IHZhbCB8IDA7XG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgLSBwb3MgPiAxMCkgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiB2YXJpbnQgZG9lc25cXCd0IGZpdCBpbnRvIDEwIGJ5dGVzJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgd3JpdGVTVmFyaW50OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludCh2YWwgPCAwID8gLXZhbCAqIDIgLSAxIDogdmFsICogMik7XG4gICAgfSxcblxuICAgIHdyaXRlQm9vbGVhbjogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnQoQm9vbGVhbih2YWwpKTtcbiAgICB9LFxuXG4gICAgd3JpdGVTdHJpbmc6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgICAgICAgdmFyIGJ5dGVzID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3RyKTtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludChieXRlcyk7XG4gICAgICAgIHRoaXMucmVhbGxvYyhieXRlcyk7XG4gICAgICAgIHRoaXMuYnVmLndyaXRlKHN0ciwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSBieXRlcztcbiAgICB9LFxuXG4gICAgd3JpdGVGbG9hdDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg0KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVGbG9hdExFKHZhbCwgdGhpcy5wb3MpO1xuICAgICAgICB0aGlzLnBvcyArPSA0O1xuICAgIH0sXG5cbiAgICB3cml0ZURvdWJsZTogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHRoaXMucmVhbGxvYyg4KTtcbiAgICAgICAgdGhpcy5idWYud3JpdGVEb3VibGVMRSh2YWwsIHRoaXMucG9zKTtcbiAgICAgICAgdGhpcy5wb3MgKz0gODtcbiAgICB9LFxuXG4gICAgd3JpdGVCeXRlczogZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgIHZhciBsZW4gPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICB0aGlzLndyaXRlVmFyaW50KGxlbik7XG4gICAgICAgIHRoaXMucmVhbGxvYyhsZW4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB0aGlzLmJ1Zlt0aGlzLnBvcysrXSA9IGJ1ZmZlcltpXTtcbiAgICB9LFxuXG4gICAgd3JpdGVSYXdNZXNzYWdlOiBmdW5jdGlvbihmbiwgb2JqKSB7XG4gICAgICAgIHRoaXMucG9zKys7IC8vIHJlc2VydmUgMSBieXRlIGZvciBzaG9ydCBtZXNzYWdlIGxlbmd0aFxuXG4gICAgICAgIC8vIHdyaXRlIHRoZSBtZXNzYWdlIGRpcmVjdGx5IHRvIHRoZSBidWZmZXIgYW5kIHNlZSBob3cgbXVjaCB3YXMgd3JpdHRlblxuICAgICAgICB2YXIgc3RhcnRQb3MgPSB0aGlzLnBvcztcbiAgICAgICAgZm4ob2JqLCB0aGlzKTtcbiAgICAgICAgdmFyIGxlbiA9IHRoaXMucG9zIC0gc3RhcnRQb3M7XG5cbiAgICAgICAgdmFyIHZhcmludExlbiA9XG4gICAgICAgICAgICBsZW4gPD0gMHg3ZiA/IDEgOlxuICAgICAgICAgICAgbGVuIDw9IDB4M2ZmZiA/IDIgOlxuICAgICAgICAgICAgbGVuIDw9IDB4MWZmZmZmID8gMyA6XG4gICAgICAgICAgICBsZW4gPD0gMHhmZmZmZmZmID8gNCA6IE1hdGguY2VpbChNYXRoLmxvZyhsZW4pIC8gKE1hdGguTE4yICogNykpO1xuXG4gICAgICAgIC8vIGlmIDEgYnl0ZSBpc24ndCBlbm91Z2ggZm9yIGVuY29kaW5nIG1lc3NhZ2UgbGVuZ3RoLCBzaGlmdCB0aGUgZGF0YSB0byB0aGUgcmlnaHRcbiAgICAgICAgaWYgKHZhcmludExlbiA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMucmVhbGxvYyh2YXJpbnRMZW4gLSAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLnBvcyAtIDE7IGkgPj0gc3RhcnRQb3M7IGktLSkgdGhpcy5idWZbaSArIHZhcmludExlbiAtIDFdID0gdGhpcy5idWZbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmaW5hbGx5LCB3cml0ZSB0aGUgbWVzc2FnZSBsZW5ndGggaW4gdGhlIHJlc2VydmVkIHBsYWNlIGFuZCByZXN0b3JlIHRoZSBwb3NpdGlvblxuICAgICAgICB0aGlzLnBvcyA9IHN0YXJ0UG9zIC0gMTtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludChsZW4pO1xuICAgICAgICB0aGlzLnBvcyArPSBsZW47XG4gICAgfSxcblxuICAgIHdyaXRlTWVzc2FnZTogZnVuY3Rpb24odGFnLCBmbiwgb2JqKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuQnl0ZXMpO1xuICAgICAgICB0aGlzLndyaXRlUmF3TWVzc2FnZShmbiwgb2JqKTtcbiAgICB9LFxuXG4gICAgd3JpdGVQYWNrZWRWYXJpbnQ6ICAgZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZFZhcmludCwgYXJyKTsgICB9LFxuICAgIHdyaXRlUGFja2VkU1ZhcmludDogIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRTVmFyaW50LCBhcnIpOyAgfSxcbiAgICB3cml0ZVBhY2tlZEJvb2xlYW46ICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkQm9vbGVhbiwgYXJyKTsgIH0sXG4gICAgd3JpdGVQYWNrZWRGbG9hdDogICAgZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZEZsb2F0LCBhcnIpOyAgICB9LFxuICAgIHdyaXRlUGFja2VkRG91YmxlOiAgIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWREb3VibGUsIGFycik7ICAgfSxcbiAgICB3cml0ZVBhY2tlZEZpeGVkMzI6ICBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkRml4ZWQzMiwgYXJyKTsgIH0sXG4gICAgd3JpdGVQYWNrZWRTRml4ZWQzMjogZnVuY3Rpb24odGFnLCBhcnIpIHsgdGhpcy53cml0ZU1lc3NhZ2UodGFnLCB3cml0ZVBhY2tlZFNGaXhlZDMyLCBhcnIpOyB9LFxuICAgIHdyaXRlUGFja2VkRml4ZWQ2NDogIGZ1bmN0aW9uKHRhZywgYXJyKSB7IHRoaXMud3JpdGVNZXNzYWdlKHRhZywgd3JpdGVQYWNrZWRGaXhlZDY0LCBhcnIpOyAgfSxcbiAgICB3cml0ZVBhY2tlZFNGaXhlZDY0OiBmdW5jdGlvbih0YWcsIGFycikgeyB0aGlzLndyaXRlTWVzc2FnZSh0YWcsIHdyaXRlUGFja2VkU0ZpeGVkNjQsIGFycik7IH0sXG5cbiAgICB3cml0ZUJ5dGVzRmllbGQ6IGZ1bmN0aW9uKHRhZywgYnVmZmVyKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuQnl0ZXMpO1xuICAgICAgICB0aGlzLndyaXRlQnl0ZXMoYnVmZmVyKTtcbiAgICB9LFxuICAgIHdyaXRlRml4ZWQzMkZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkMzIpO1xuICAgICAgICB0aGlzLndyaXRlRml4ZWQzMih2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVTRml4ZWQzMkZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkMzIpO1xuICAgICAgICB0aGlzLndyaXRlU0ZpeGVkMzIodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlRml4ZWQ2NEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkNjQpO1xuICAgICAgICB0aGlzLndyaXRlRml4ZWQ2NCh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVTRml4ZWQ2NEZpZWxkOiBmdW5jdGlvbih0YWcsIHZhbCkge1xuICAgICAgICB0aGlzLndyaXRlVGFnKHRhZywgUGJmLkZpeGVkNjQpO1xuICAgICAgICB0aGlzLndyaXRlU0ZpeGVkNjQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlVmFyaW50RmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuVmFyaW50KTtcbiAgICAgICAgdGhpcy53cml0ZVZhcmludCh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVTVmFyaW50RmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuVmFyaW50KTtcbiAgICAgICAgdGhpcy53cml0ZVNWYXJpbnQodmFsKTtcbiAgICB9LFxuICAgIHdyaXRlU3RyaW5nRmllbGQ6IGZ1bmN0aW9uKHRhZywgc3RyKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuQnl0ZXMpO1xuICAgICAgICB0aGlzLndyaXRlU3RyaW5nKHN0cik7XG4gICAgfSxcbiAgICB3cml0ZUZsb2F0RmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVUYWcodGFnLCBQYmYuRml4ZWQzMik7XG4gICAgICAgIHRoaXMud3JpdGVGbG9hdCh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVEb3VibGVGaWVsZDogZnVuY3Rpb24odGFnLCB2YWwpIHtcbiAgICAgICAgdGhpcy53cml0ZVRhZyh0YWcsIFBiZi5GaXhlZDY0KTtcbiAgICAgICAgdGhpcy53cml0ZURvdWJsZSh2YWwpO1xuICAgIH0sXG4gICAgd3JpdGVCb29sZWFuRmllbGQ6IGZ1bmN0aW9uKHRhZywgdmFsKSB7XG4gICAgICAgIHRoaXMud3JpdGVWYXJpbnRGaWVsZCh0YWcsIEJvb2xlYW4odmFsKSk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gd3JpdGVQYWNrZWRWYXJpbnQoYXJyLCBwYmYpICAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlVmFyaW50KGFycltpXSk7ICAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRTVmFyaW50KGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlU1ZhcmludChhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRGbG9hdChhcnIsIHBiZikgICAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRmxvYXQoYXJyW2ldKTsgICAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWREb3VibGUoYXJyLCBwYmYpICAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRG91YmxlKGFycltpXSk7ICAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRCb29sZWFuKGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlQm9vbGVhbihhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRGaXhlZDMyKGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRml4ZWQzMihhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRTRml4ZWQzMihhcnIsIHBiZikgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlU0ZpeGVkMzIoYXJyW2ldKTsgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRGaXhlZDY0KGFyciwgcGJmKSAgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlRml4ZWQ2NChhcnJbaV0pOyAgfVxuZnVuY3Rpb24gd3JpdGVQYWNrZWRTRml4ZWQ2NChhcnIsIHBiZikgeyBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgcGJmLndyaXRlU0ZpeGVkNjQoYXJyW2ldKTsgfVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYkltNXZaR1ZmYlc5a2RXeGxjeTl3WW1ZdmFXNWtaWGd1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWp0QlFVRkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUluZFhObElITjBjbWxqZENjN1hHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdVR0ptTzF4dVhHNTJZWElnUW5WbVptVnlJRDBnWjJ4dlltRnNMa0oxWm1abGNpQjhmQ0J5WlhGMWFYSmxLQ2N1TDJKMVptWmxjaWNwTzF4dVhHNW1kVzVqZEdsdmJpQlFZbVlvWW5WbUtTQjdYRzRnSUNBZ2RHaHBjeTVpZFdZZ1BTQWhRblZtWm1WeUxtbHpRblZtWm1WeUtHSjFaaWtnUHlCdVpYY2dRblZtWm1WeUtHSjFaaUI4ZkNBd0tTQTZJR0oxWmp0Y2JpQWdJQ0IwYUdsekxuQnZjeUE5SURBN1hHNGdJQ0FnZEdocGN5NXNaVzVuZEdnZ1BTQjBhR2x6TG1KMVppNXNaVzVuZEdnN1hHNTlYRzVjYmxCaVppNVdZWEpwYm5RZ0lEMGdNRHNnTHk4Z2RtRnlhVzUwT2lCcGJuUXpNaXdnYVc1ME5qUXNJSFZwYm5Rek1pd2dkV2x1ZERZMExDQnphVzUwTXpJc0lITnBiblEyTkN3Z1ltOXZiQ3dnWlc1MWJWeHVVR0ptTGtacGVHVmtOalFnUFNBeE95QXZMeUEyTkMxaWFYUTZJR1J2ZFdKc1pTd2dabWw0WldRMk5Dd2djMlpwZUdWa05qUmNibEJpWmk1Q2VYUmxjeUFnSUQwZ01qc2dMeThnYkdWdVozUm9MV1JsYkdsdGFYUmxaRG9nYzNSeWFXNW5MQ0JpZVhSbGN5d2daVzFpWldSa1pXUWdiV1Z6YzJGblpYTXNJSEJoWTJ0bFpDQnlaWEJsWVhSbFpDQm1hV1ZzWkhOY2JsQmlaaTVHYVhobFpETXlJRDBnTlRzZ0x5OGdNekl0WW1sME9pQm1iRzloZEN3Z1ptbDRaV1F6TWl3Z2MyWnBlR1ZrTXpKY2JseHVkbUZ5SUZOSVNVWlVYMHhGUmxSZk16SWdQU0FvTVNBOFBDQXhOaWtnS2lBb01TQThQQ0F4Tmlrc1hHNGdJQ0FnVTBoSlJsUmZVa2xIU0ZSZk16SWdQU0F4SUM4Z1UwaEpSbFJmVEVWR1ZGOHpNaXhjYmlBZ0lDQlFUMWRmTWw4Mk15QTlJRTFoZEdndWNHOTNLRElzSURZektUdGNibHh1VUdKbUxuQnliM1J2ZEhsd1pTQTlJSHRjYmx4dUlDQWdJR1JsYzNSeWIzazZJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJQ0FnSUNCMGFHbHpMbUoxWmlBOUlHNTFiR3c3WEc0Z0lDQWdmU3hjYmx4dUlDQWdJQzh2SUQwOVBTQlNSVUZFU1U1SElEMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlYRzVjYmlBZ0lDQnlaV0ZrUm1sbGJHUnpPaUJtZFc1amRHbHZiaWh5WldGa1JtbGxiR1FzSUhKbGMzVnNkQ3dnWlc1a0tTQjdYRzRnSUNBZ0lDQWdJR1Z1WkNBOUlHVnVaQ0I4ZkNCMGFHbHpMbXhsYm1kMGFEdGNibHh1SUNBZ0lDQWdJQ0IzYUdsc1pTQW9kR2hwY3k1d2IzTWdQQ0JsYm1RcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGNpQjJZV3dnUFNCMGFHbHpMbkpsWVdSV1lYSnBiblFvS1N4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMFlXY2dQU0IyWVd3Z1BqNGdNeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGeWRGQnZjeUE5SUhSb2FYTXVjRzl6TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WldGa1JtbGxiR1FvZEdGbkxDQnlaWE4xYkhRc0lIUm9hWE1wTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTV3YjNNZ1BUMDlJSE4wWVhKMFVHOXpLU0IwYUdsekxuTnJhWEFvZG1Gc0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdjbVZ6ZFd4ME8xeHVJQ0FnSUgwc1hHNWNiaUFnSUNCeVpXRmtUV1Z6YzJGblpUb2dablZ1WTNScGIyNG9jbVZoWkVacFpXeGtMQ0J5WlhOMWJIUXBJSHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdWNtVmhaRVpwWld4a2N5aHlaV0ZrUm1sbGJHUXNJSEpsYzNWc2RDd2dkR2hwY3k1eVpXRmtWbUZ5YVc1MEtDa2dLeUIwYUdsekxuQnZjeWs3WEc0Z0lDQWdmU3hjYmx4dUlDQWdJSEpsWVdSR2FYaGxaRE15T2lCbWRXNWpkR2x2YmlncElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUhaaGJDQTlJSFJvYVhNdVluVm1MbkpsWVdSVlNXNTBNekpNUlNoMGFHbHpMbkJ2Y3lrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y0c5eklDczlJRFE3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIyWVd3N1hHNGdJQ0FnZlN4Y2JseHVJQ0FnSUhKbFlXUlRSbWw0WldRek1qb2dablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQjJZV3dnUFNCMGFHbHpMbUoxWmk1eVpXRmtTVzUwTXpKTVJTaDBhR2x6TG5CdmN5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdWNHOXpJQ3M5SURRN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMllXdzdYRzRnSUNBZ2ZTeGNibHh1SUNBZ0lDOHZJRFkwTFdKcGRDQnBiblFnYUdGdVpHeHBibWNnYVhNZ1ltRnpaV1FnYjI0Z1oybDBhSFZpTG1OdmJTOWtjSGN2Ym05a1pTMWlkV1ptWlhJdGJXOXlaUzFwYm5SeklDaE5TVlF0YkdsalpXNXpaV1FwWEc1Y2JpQWdJQ0J5WldGa1JtbDRaV1EyTkRvZ1puVnVZM1JwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCMllXd2dQU0IwYUdsekxtSjFaaTV5WldGa1ZVbHVkRE15VEVVb2RHaHBjeTV3YjNNcElDc2dkR2hwY3k1aWRXWXVjbVZoWkZWSmJuUXpNa3hGS0hSb2FYTXVjRzl6SUNzZ05Da2dLaUJUU0VsR1ZGOU1SVVpVWHpNeU8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5CdmN5QXJQU0E0TzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZG1Gc08xeHVJQ0FnSUgwc1hHNWNiaUFnSUNCeVpXRmtVMFpwZUdWa05qUTZJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJQ0FnSUNCMllYSWdkbUZzSUQwZ2RHaHBjeTVpZFdZdWNtVmhaRlZKYm5Rek1reEZLSFJvYVhNdWNHOXpLU0FySUhSb2FYTXVZblZtTG5KbFlXUkpiblF6TWt4RktIUm9hWE11Y0c5eklDc2dOQ2tnS2lCVFNFbEdWRjlNUlVaVVh6TXlPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuQnZjeUFyUFNBNE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RtRnNPMXh1SUNBZ0lIMHNYRzVjYmlBZ0lDQnlaV0ZrUm14dllYUTZJR1oxYm1OMGFXOXVLQ2tnZTF4dUlDQWdJQ0FnSUNCMllYSWdkbUZzSUQwZ2RHaHBjeTVpZFdZdWNtVmhaRVpzYjJGMFRFVW9kR2hwY3k1d2IzTXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuQnZjeUFyUFNBME8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RtRnNPMXh1SUNBZ0lIMHNYRzVjYmlBZ0lDQnlaV0ZrUkc5MVlteGxPaUJtZFc1amRHbHZiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2RtRnlJSFpoYkNBOUlIUm9hWE11WW5WbUxuSmxZV1JFYjNWaWJHVk1SU2gwYUdsekxuQnZjeWs3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjRzl6SUNzOUlEZzdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjJZV3c3WEc0Z0lDQWdmU3hjYmx4dUlDQWdJSEpsWVdSV1lYSnBiblE2SUdaMWJtTjBhVzl1S0NrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWW5WbUlEMGdkR2hwY3k1aWRXWXNYRzRnSUNBZ0lDQWdJQ0FnSUNCMllXd3NJR0lzSUdJd0xDQmlNU3dnWWpJc0lHSXpPMXh1WEc0Z0lDQWdJQ0FnSUdJd0lEMGdZblZtVzNSb2FYTXVjRzl6S3l0ZE95QnBaaUFvWWpBZ1BDQXdlRGd3S1NCeVpYUjFjbTRnWWpBN0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaU1DQTlJR0l3SUNZZ01IZzNaanRjYmlBZ0lDQWdJQ0FnWWpFZ1BTQmlkV1piZEdocGN5NXdiM01ySzEwN0lHbG1JQ2hpTVNBOElEQjRPREFwSUhKbGRIVnliaUJpTUNCOElHSXhJRHc4SURjN0lDQWdJQ0FnSUdJeElEMGdLR0l4SUNZZ01IZzNaaWtnUER3Z056dGNiaUFnSUNBZ0lDQWdZaklnUFNCaWRXWmJkR2hwY3k1d2IzTXJLMTA3SUdsbUlDaGlNaUE4SURCNE9EQXBJSEpsZEhWeWJpQmlNQ0I4SUdJeElId2dZaklnUER3Z01UUTdJR0l5SUQwZ0tHSXlJQ1lnTUhnM1ppa2dQRHdnTVRRN1hHNGdJQ0FnSUNBZ0lHSXpJRDBnWW5WbVczUm9hWE11Y0c5ekt5dGRPeUJwWmlBb1lqTWdQQ0F3ZURnd0tTQnlaWFIxY200Z1lqQWdmQ0JpTVNCOElHSXlJSHdnWWpNZ1BEd2dNakU3WEc1Y2JpQWdJQ0FnSUNBZ2RtRnNJRDBnWWpBZ2ZDQmlNU0I4SUdJeUlId2dLR0l6SUNZZ01IZzNaaWtnUER3Z01qRTdYRzVjYmlBZ0lDQWdJQ0FnWWlBOUlHSjFabHQwYUdsekxuQnZjeXNyWFRzZ2RtRnNJQ3M5SUNoaUlDWWdNSGczWmlrZ0tpQXdlREV3TURBd01EQXdPeUFnSUNBZ0lDQWdJR2xtSUNoaUlEd2dNSGc0TUNrZ2NtVjBkWEp1SUhaaGJEdGNiaUFnSUNBZ0lDQWdZaUE5SUdKMVpsdDBhR2x6TG5CdmN5c3JYVHNnZG1Gc0lDczlJQ2hpSUNZZ01IZzNaaWtnS2lBd2VEZ3dNREF3TURBd01Ec2dJQ0FnSUNBZ0lHbG1JQ2hpSUR3Z01IZzRNQ2tnY21WMGRYSnVJSFpoYkR0Y2JpQWdJQ0FnSUNBZ1lpQTlJR0oxWmx0MGFHbHpMbkJ2Y3lzclhUc2dkbUZzSUNzOUlDaGlJQ1lnTUhnM1ppa2dLaUF3ZURRd01EQXdNREF3TURBd095QWdJQ0FnSUdsbUlDaGlJRHdnTUhnNE1Da2djbVYwZFhKdUlIWmhiRHRjYmlBZ0lDQWdJQ0FnWWlBOUlHSjFabHQwYUdsekxuQnZjeXNyWFRzZ2RtRnNJQ3M5SUNoaUlDWWdNSGczWmlrZ0tpQXdlREl3TURBd01EQXdNREF3TURBN0lDQWdJR2xtSUNoaUlEd2dNSGc0TUNrZ2NtVjBkWEp1SUhaaGJEdGNiaUFnSUNBZ0lDQWdZaUE5SUdKMVpsdDBhR2x6TG5CdmN5c3JYVHNnZG1Gc0lDczlJQ2hpSUNZZ01IZzNaaWtnS2lBd2VERXdNREF3TURBd01EQXdNREF3TURzZ0lHbG1JQ2hpSUR3Z01IZzRNQ2tnY21WMGRYSnVJSFpoYkR0Y2JpQWdJQ0FnSUNBZ1lpQTlJR0oxWmx0MGFHbHpMbkJ2Y3lzclhUc2dkbUZzSUNzOUlDaGlJQ1lnTUhnM1ppa2dLaUF3ZURnd01EQXdNREF3TURBd01EQXdNREE3SUdsbUlDaGlJRHdnTUhnNE1Da2djbVYwZFhKdUlIWmhiRHRjYmx4dUlDQWdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1JYSnliM0lvSjBWNGNHVmpkR1ZrSUhaaGNtbHVkQ0J1YjNRZ2JXOXlaU0IwYUdGdUlERXdJR0o1ZEdWekp5azdYRzRnSUNBZ2ZTeGNibHh1SUNBZ0lISmxZV1JXWVhKcGJuUTJORG9nWm5WdVkzUnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lIWmhjaUJ6ZEdGeWRGQnZjeUE5SUhSb2FYTXVjRzl6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdkbUZzSUQwZ2RHaHBjeTV5WldGa1ZtRnlhVzUwS0NrN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0haaGJDQThJRkJQVjE4eVh6WXpLU0J5WlhSMWNtNGdkbUZzTzF4dVhHNGdJQ0FnSUNBZ0lIWmhjaUJ3YjNNZ1BTQjBhR2x6TG5CdmN5QXRJREk3WEc0Z0lDQWdJQ0FnSUhkb2FXeGxJQ2gwYUdsekxtSjFabHR3YjNOZElEMDlQU0F3ZUdabUtTQndiM010TFR0Y2JpQWdJQ0FnSUNBZ2FXWWdLSEJ2Y3lBOElITjBZWEowVUc5ektTQndiM01nUFNCemRHRnlkRkJ2Y3p0Y2JseHVJQ0FnSUNBZ0lDQjJZV3dnUFNBd08xeHVJQ0FnSUNBZ0lDQm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJSEJ2Y3lBdElITjBZWEowVUc5eklDc2dNVHNnYVNzcktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMllYSWdZaUE5SUg1MGFHbHpMbUoxWmx0emRHRnlkRkJ2Y3lBcklHbGRJQ1lnTUhnM1pqdGNiaUFnSUNBZ0lDQWdJQ0FnSUhaaGJDQXJQU0JwSUR3Z05DQS9JR0lnUER3Z2FTQXFJRGNnT2lCaUlDb2dUV0YwYUM1d2IzY29NaXdnYVNBcUlEY3BPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUMxMllXd2dMU0F4TzF4dUlDQWdJSDBzWEc1Y2JpQWdJQ0J5WldGa1UxWmhjbWx1ZERvZ1puVnVZM1JwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCdWRXMGdQU0IwYUdsekxuSmxZV1JXWVhKcGJuUW9LVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzUxYlNBbElESWdQVDA5SURFZ1B5QW9iblZ0SUNzZ01Ta2dMeUF0TWlBNklHNTFiU0F2SURJN0lDOHZJSHBwWjNwaFp5QmxibU52WkdsdVoxeHVJQ0FnSUgwc1hHNWNiaUFnSUNCeVpXRmtRbTl2YkdWaGJqb2dablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJDYjI5c1pXRnVLSFJvYVhNdWNtVmhaRlpoY21sdWRDZ3BLVHRjYmlBZ0lDQjlMRnh1WEc0Z0lDQWdjbVZoWkZOMGNtbHVaem9nWm5WdVkzUnBiMjRvS1NCN1hHNGdJQ0FnSUNBZ0lIWmhjaUJsYm1RZ1BTQjBhR2x6TG5KbFlXUldZWEpwYm5Rb0tTQXJJSFJvYVhNdWNHOXpMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2MzUnlJRDBnZEdocGN5NWlkV1l1ZEc5VGRISnBibWNvSjNWMFpqZ25MQ0IwYUdsekxuQnZjeXdnWlc1a0tUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1d2IzTWdQU0JsYm1RN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCemRISTdYRzRnSUNBZ2ZTeGNibHh1SUNBZ0lISmxZV1JDZVhSbGN6b2dablZ1WTNScGIyNG9LU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQmxibVFnUFNCMGFHbHpMbkpsWVdSV1lYSnBiblFvS1NBcklIUm9hWE11Y0c5ekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnWW5WbVptVnlJRDBnZEdocGN5NWlkV1l1YzJ4cFkyVW9kR2hwY3k1d2IzTXNJR1Z1WkNrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y0c5eklEMGdaVzVrTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWW5WbVptVnlPMXh1SUNBZ0lIMHNYRzVjYmlBZ0lDQXZMeUIyWlhKaWIzTmxJR1p2Y2lCd1pYSm1iM0p0WVc1alpTQnlaV0Z6YjI1ek95QmtiMlZ6YmlkMElHRm1abVZqZENCbmVtbHdjR1ZrSUhOcGVtVmNibHh1SUNBZ0lISmxZV1JRWVdOclpXUldZWEpwYm5RNklHWjFibU4wYVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pXNWtJRDBnZEdocGN5NXlaV0ZrVm1GeWFXNTBLQ2tnS3lCMGFHbHpMbkJ2Y3l3Z1lYSnlJRDBnVzEwN1hHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNoMGFHbHpMbkJ2Y3lBOElHVnVaQ2tnWVhKeUxuQjFjMmdvZEdocGN5NXlaV0ZrVm1GeWFXNTBLQ2twTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWVhKeU8xeHVJQ0FnSUgwc1hHNGdJQ0FnY21WaFpGQmhZMnRsWkZOV1lYSnBiblE2SUdaMWJtTjBhVzl1S0NrZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWlc1a0lEMGdkR2hwY3k1eVpXRmtWbUZ5YVc1MEtDa2dLeUIwYUdsekxuQnZjeXdnWVhKeUlEMGdXMTA3WEc0Z0lDQWdJQ0FnSUhkb2FXeGxJQ2gwYUdsekxuQnZjeUE4SUdWdVpDa2dZWEp5TG5CMWMyZ29kR2hwY3k1eVpXRmtVMVpoY21sdWRDZ3BLVHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR0Z5Y2p0Y2JpQWdJQ0I5TEZ4dUlDQWdJSEpsWVdSUVlXTnJaV1JDYjI5c1pXRnVPaUJtZFc1amRHbHZiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2RtRnlJR1Z1WkNBOUlIUm9hWE11Y21WaFpGWmhjbWx1ZENncElDc2dkR2hwY3k1d2IzTXNJR0Z5Y2lBOUlGdGRPMXh1SUNBZ0lDQWdJQ0IzYUdsc1pTQW9kR2hwY3k1d2IzTWdQQ0JsYm1RcElHRnljaTV3ZFhOb0tIUm9hWE11Y21WaFpFSnZiMnhsWVc0b0tTazdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhjbkk3WEc0Z0lDQWdmU3hjYmlBZ0lDQnlaV0ZrVUdGamEyVmtSbXh2WVhRNklHWjFibU4wYVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pXNWtJRDBnZEdocGN5NXlaV0ZrVm1GeWFXNTBLQ2tnS3lCMGFHbHpMbkJ2Y3l3Z1lYSnlJRDBnVzEwN1hHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNoMGFHbHpMbkJ2Y3lBOElHVnVaQ2tnWVhKeUxuQjFjMmdvZEdocGN5NXlaV0ZrUm14dllYUW9LU2s3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoY25JN1hHNGdJQ0FnZlN4Y2JpQWdJQ0J5WldGa1VHRmphMlZrUkc5MVlteGxPaUJtZFc1amRHbHZiaWdwSUh0Y2JpQWdJQ0FnSUNBZ2RtRnlJR1Z1WkNBOUlIUm9hWE11Y21WaFpGWmhjbWx1ZENncElDc2dkR2hwY3k1d2IzTXNJR0Z5Y2lBOUlGdGRPMXh1SUNBZ0lDQWdJQ0IzYUdsc1pTQW9kR2hwY3k1d2IzTWdQQ0JsYm1RcElHRnljaTV3ZFhOb0tIUm9hWE11Y21WaFpFUnZkV0pzWlNncEtUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHRnljanRjYmlBZ0lDQjlMRnh1SUNBZ0lISmxZV1JRWVdOclpXUkdhWGhsWkRNeU9pQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ0lDQWdJQ0FnZG1GeUlHVnVaQ0E5SUhSb2FYTXVjbVZoWkZaaGNtbHVkQ2dwSUNzZ2RHaHBjeTV3YjNNc0lHRnljaUE5SUZ0ZE8xeHVJQ0FnSUNBZ0lDQjNhR2xzWlNBb2RHaHBjeTV3YjNNZ1BDQmxibVFwSUdGeWNpNXdkWE5vS0hSb2FYTXVjbVZoWkVacGVHVmtNeklvS1NrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCaGNuSTdYRzRnSUNBZ2ZTeGNiaUFnSUNCeVpXRmtVR0ZqYTJWa1UwWnBlR1ZrTXpJNklHWjFibU4wYVc5dUtDa2dlMXh1SUNBZ0lDQWdJQ0IyWVhJZ1pXNWtJRDBnZEdocGN5NXlaV0ZrVm1GeWFXNTBLQ2tnS3lCMGFHbHpMbkJ2Y3l3Z1lYSnlJRDBnVzEwN1hHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNoMGFHbHpMbkJ2Y3lBOElHVnVaQ2tnWVhKeUxuQjFjMmdvZEdocGN5NXlaV0ZrVTBacGVHVmtNeklvS1NrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCaGNuSTdYRzRnSUNBZ2ZTeGNiaUFnSUNCeVpXRmtVR0ZqYTJWa1JtbDRaV1EyTkRvZ1puVnVZM1JwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSFpoY2lCbGJtUWdQU0IwYUdsekxuSmxZV1JXWVhKcGJuUW9LU0FySUhSb2FYTXVjRzl6TENCaGNuSWdQU0JiWFR0Y2JpQWdJQ0FnSUNBZ2QyaHBiR1VnS0hSb2FYTXVjRzl6SUR3Z1pXNWtLU0JoY25JdWNIVnphQ2gwYUdsekxuSmxZV1JHYVhobFpEWTBLQ2twTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWVhKeU8xeHVJQ0FnSUgwc1hHNGdJQ0FnY21WaFpGQmhZMnRsWkZOR2FYaGxaRFkwT2lCbWRXNWpkR2x2YmlncElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUdWdVpDQTlJSFJvYVhNdWNtVmhaRlpoY21sdWRDZ3BJQ3NnZEdocGN5NXdiM01zSUdGeWNpQTlJRnRkTzF4dUlDQWdJQ0FnSUNCM2FHbHNaU0FvZEdocGN5NXdiM01nUENCbGJtUXBJR0Z5Y2k1d2RYTm9LSFJvYVhNdWNtVmhaRk5HYVhobFpEWTBLQ2twTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWVhKeU8xeHVJQ0FnSUgwc1hHNWNiaUFnSUNCemEybHdPaUJtZFc1amRHbHZiaWgyWVd3cElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUhSNWNHVWdQU0IyWVd3Z0ppQXdlRGM3WEc0Z0lDQWdJQ0FnSUdsbUlDaDBlWEJsSUQwOVBTQlFZbVl1Vm1GeWFXNTBLU0IzYUdsc1pTQW9kR2hwY3k1aWRXWmJkR2hwY3k1d2IzTXJLMTBnUGlBd2VEZG1LU0I3ZlZ4dUlDQWdJQ0FnSUNCbGJITmxJR2xtSUNoMGVYQmxJRDA5UFNCUVltWXVRbmwwWlhNcElIUm9hWE11Y0c5eklEMGdkR2hwY3k1eVpXRmtWbUZ5YVc1MEtDa2dLeUIwYUdsekxuQnZjenRjYmlBZ0lDQWdJQ0FnWld4elpTQnBaaUFvZEhsd1pTQTlQVDBnVUdKbUxrWnBlR1ZrTXpJcElIUm9hWE11Y0c5eklDczlJRFE3WEc0Z0lDQWdJQ0FnSUdWc2MyVWdhV1lnS0hSNWNHVWdQVDA5SUZCaVppNUdhWGhsWkRZMEtTQjBhR2x6TG5CdmN5QXJQU0E0TzF4dUlDQWdJQ0FnSUNCbGJITmxJSFJvY205M0lHNWxkeUJGY25KdmNpZ25WVzVwYlhCc1pXMWxiblJsWkNCMGVYQmxPaUFuSUNzZ2RIbHdaU2s3WEc0Z0lDQWdmU3hjYmx4dUlDQWdJQzh2SUQwOVBTQlhVa2xVU1U1SElEMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlYRzVjYmlBZ0lDQjNjbWwwWlZSaFp6b2dablZ1WTNScGIyNG9kR0ZuTENCMGVYQmxLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVkM0pwZEdWV1lYSnBiblFvS0hSaFp5QThQQ0F6S1NCOElIUjVjR1VwTzF4dUlDQWdJSDBzWEc1Y2JpQWdJQ0J5WldGc2JHOWpPaUJtZFc1amRHbHZiaWh0YVc0cElIdGNiaUFnSUNBZ0lDQWdkbUZ5SUd4bGJtZDBhQ0E5SUhSb2FYTXViR1Z1WjNSb0lIeDhJREUyTzF4dVhHNGdJQ0FnSUNBZ0lIZG9hV3hsSUNoc1pXNW5kR2dnUENCMGFHbHpMbkJ2Y3lBcklHMXBiaWtnYkdWdVozUm9JQ285SURJN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0d4bGJtZDBhQ0FoUFQwZ2RHaHBjeTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhjaUJpZFdZZ1BTQnVaWGNnUW5WbVptVnlLR3hsYm1kMGFDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbUoxWmk1amIzQjVLR0oxWmlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtSjFaaUE5SUdKMVpqdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXViR1Z1WjNSb0lEMGdiR1Z1WjNSb08xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZTeGNibHh1SUNBZ0lHWnBibWx6YURvZ1puVnVZM1JwYjI0b0tTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdWJHVnVaM1JvSUQwZ2RHaHBjeTV3YjNNN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y0c5eklEMGdNRHRjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJvYVhNdVluVm1Mbk5zYVdObEtEQXNJSFJvYVhNdWJHVnVaM1JvS1R0Y2JpQWdJQ0I5TEZ4dVhHNGdJQ0FnZDNKcGRHVkdhWGhsWkRNeU9pQm1kVzVqZEdsdmJpaDJZV3dwSUh0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV5WldGc2JHOWpLRFFwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbUoxWmk1M2NtbDBaVlZKYm5Rek1reEZLSFpoYkN3Z2RHaHBjeTV3YjNNcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5CdmN5QXJQU0EwTzF4dUlDQWdJSDBzWEc1Y2JpQWdJQ0IzY21sMFpWTkdhWGhsWkRNeU9pQm1kVzVqZEdsdmJpaDJZV3dwSUh0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV5WldGc2JHOWpLRFFwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbUoxWmk1M2NtbDBaVWx1ZERNeVRFVW9kbUZzTENCMGFHbHpMbkJ2Y3lrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y0c5eklDczlJRFE3WEc0Z0lDQWdmU3hjYmx4dUlDQWdJSGR5YVhSbFJtbDRaV1EyTkRvZ1puVnVZM1JwYjI0b2RtRnNLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbVZoYkd4dll5ZzRLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWlkV1l1ZDNKcGRHVkpiblF6TWt4RktIWmhiQ0FtSUMweExDQjBhR2x6TG5CdmN5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdVluVm1MbmR5YVhSbFZVbHVkRE15VEVVb1RXRjBhQzVtYkc5dmNpaDJZV3dnS2lCVFNFbEdWRjlTU1VkSVZGOHpNaWtzSUhSb2FYTXVjRzl6SUNzZ05DazdYRzRnSUNBZ0lDQWdJSFJvYVhNdWNHOXpJQ3M5SURnN1hHNGdJQ0FnZlN4Y2JseHVJQ0FnSUhkeWFYUmxVMFpwZUdWa05qUTZJR1oxYm1OMGFXOXVLSFpoYkNrZ2UxeHVJQ0FnSUNBZ0lDQjBhR2x6TG5KbFlXeHNiMk1vT0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WW5WbUxuZHlhWFJsU1c1ME16Sk1SU2gyWVd3Z0ppQXRNU3dnZEdocGN5NXdiM01wTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbUoxWmk1M2NtbDBaVWx1ZERNeVRFVW9UV0YwYUM1bWJHOXZjaWgyWVd3Z0tpQlRTRWxHVkY5U1NVZElWRjh6TWlrc0lIUm9hWE11Y0c5eklDc2dOQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjRzl6SUNzOUlEZzdYRzRnSUNBZ2ZTeGNibHh1SUNBZ0lIZHlhWFJsVm1GeWFXNTBPaUJtZFc1amRHbHZiaWgyWVd3cElIdGNiaUFnSUNBZ0lDQWdkbUZzSUQwZ0szWmhiRHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9kbUZzSUR3OUlEQjROMllwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVmhiR3h2WXlneEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVZblZtVzNSb2FYTXVjRzl6S3l0ZElEMGdkbUZzTzF4dVhHNGdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9kbUZzSUR3OUlEQjRNMlptWmlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGN5NXlaV0ZzYkc5aktESXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVpZFdaYmRHaHBjeTV3YjNNcksxMGdQU0FvS0haaGJDQStQajRnTUNrZ0ppQXdlRGRtS1NCOElEQjRPREE3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG1KMVpsdDBhR2x6TG5CdmN5c3JYU0E5SUNnb2RtRnNJRDQrUGlBM0tTQW1JREI0TjJZcE8xeHVYRzRnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvZG1Gc0lEdzlJREI0TVdabVptWm1LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbFlXeHNiMk1vTXlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtSjFabHQwYUdsekxuQnZjeXNyWFNBOUlDZ29kbUZzSUQ0K1BpQXdLU0FtSURCNE4yWXBJSHdnTUhnNE1EdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVZblZtVzNSb2FYTXVjRzl6S3l0ZElEMGdLQ2gyWVd3Z1BqNCtJRGNwSUNZZ01IZzNaaWtnZkNBd2VEZ3dPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVpZFdaYmRHaHBjeTV3YjNNcksxMGdQU0FvS0haaGJDQStQajRnTVRRcElDWWdNSGczWmlrN1hHNWNiaUFnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2gyWVd3Z1BEMGdNSGhtWm1abVptWm1LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbFlXeHNiMk1vTkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtSjFabHQwYUdsekxuQnZjeXNyWFNBOUlDZ29kbUZzSUQ0K1BpQXdLU0FtSURCNE4yWXBJSHdnTUhnNE1EdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVZblZtVzNSb2FYTXVjRzl6S3l0ZElEMGdLQ2gyWVd3Z1BqNCtJRGNwSUNZZ01IZzNaaWtnZkNBd2VEZ3dPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHaHBjeTVpZFdaYmRHaHBjeTV3YjNNcksxMGdQU0FvS0haaGJDQStQajRnTVRRcElDWWdNSGczWmlrZ2ZDQXdlRGd3TzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR2hwY3k1aWRXWmJkR2hwY3k1d2IzTXJLMTBnUFNBb0tIWmhiQ0ErUGo0Z01qRXBJQ1lnTUhnM1ppazdYRzVjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIWmhjaUJ3YjNNZ1BTQjBhR2x6TG5CdmN6dGNiaUFnSUNBZ0lDQWdJQ0FnSUhkb2FXeGxJQ2gyWVd3Z1BqMGdNSGc0TUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE11Y21WaGJHeHZZeWd4S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpMbUoxWmx0MGFHbHpMbkJ2Y3lzclhTQTlJQ2gyWVd3Z0ppQXdlR1ptS1NCOElEQjRPREE3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZG1Gc0lDODlJREI0T0RBN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbFlXeHNiMk1vTVNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwYUdsekxtSjFabHQwYUdsekxuQnZjeXNyWFNBOUlIWmhiQ0I4SURBN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHaHBjeTV3YjNNZ0xTQndiM01nUGlBeE1Da2dkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZEhhWFpsYmlCMllYSnBiblFnWkc5bGMyNWNYQ2QwSUdacGRDQnBiblJ2SURFd0lHSjVkR1Z6SnlrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOUxGeHVYRzRnSUNBZ2QzSnBkR1ZUVm1GeWFXNTBPaUJtZFc1amRHbHZiaWgyWVd3cElIdGNiaUFnSUNBZ0lDQWdkR2hwY3k1M2NtbDBaVlpoY21sdWRDaDJZV3dnUENBd0lEOGdMWFpoYkNBcUlESWdMU0F4SURvZ2RtRnNJQ29nTWlrN1hHNGdJQ0FnZlN4Y2JseHVJQ0FnSUhkeWFYUmxRbTl2YkdWaGJqb2dablZ1WTNScGIyNG9kbUZzS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11ZDNKcGRHVldZWEpwYm5Rb1FtOXZiR1ZoYmloMllXd3BLVHRjYmlBZ0lDQjlMRnh1WEc0Z0lDQWdkM0pwZEdWVGRISnBibWM2SUdaMWJtTjBhVzl1S0hOMGNpa2dlMXh1SUNBZ0lDQWdJQ0J6ZEhJZ1BTQlRkSEpwYm1jb2MzUnlLVHRjYmlBZ0lDQWdJQ0FnZG1GeUlHSjVkR1Z6SUQwZ1FuVm1abVZ5TG1KNWRHVk1aVzVuZEdnb2MzUnlLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NTNjbWwwWlZaaGNtbHVkQ2hpZVhSbGN5azdYRzRnSUNBZ0lDQWdJSFJvYVhNdWNtVmhiR3h2WXloaWVYUmxjeWs3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVZblZtTG5keWFYUmxLSE4wY2l3Z2RHaHBjeTV3YjNNcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5CdmN5QXJQU0JpZVhSbGN6dGNiaUFnSUNCOUxGeHVYRzRnSUNBZ2QzSnBkR1ZHYkc5aGREb2dablZ1WTNScGIyNG9kbUZzS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y21WaGJHeHZZeWcwS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVpZFdZdWQzSnBkR1ZHYkc5aGRFeEZLSFpoYkN3Z2RHaHBjeTV3YjNNcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5CdmN5QXJQU0EwTzF4dUlDQWdJSDBzWEc1Y2JpQWdJQ0IzY21sMFpVUnZkV0pzWlRvZ1puVnVZM1JwYjI0b2RtRnNLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVjbVZoYkd4dll5ZzRLVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWlkV1l1ZDNKcGRHVkViM1ZpYkdWTVJTaDJZV3dzSUhSb2FYTXVjRzl6S1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV3YjNNZ0t6MGdPRHRjYmlBZ0lDQjlMRnh1WEc0Z0lDQWdkM0pwZEdWQ2VYUmxjem9nWm5WdVkzUnBiMjRvWW5WbVptVnlLU0I3WEc0Z0lDQWdJQ0FnSUhaaGNpQnNaVzRnUFNCaWRXWm1aWEl1YkdWdVozUm9PMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHlhWFJsVm1GeWFXNTBLR3hsYmlrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y21WaGJHeHZZeWhzWlc0cE8xeHVJQ0FnSUNBZ0lDQm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR3hsYmpzZ2FTc3JLU0IwYUdsekxtSjFabHQwYUdsekxuQnZjeXNyWFNBOUlHSjFabVpsY2x0cFhUdGNiaUFnSUNCOUxGeHVYRzRnSUNBZ2QzSnBkR1ZTWVhkTlpYTnpZV2RsT2lCbWRXNWpkR2x2YmlobWJpd2diMkpxS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11Y0c5ekt5czdJQzh2SUhKbGMyVnlkbVVnTVNCaWVYUmxJR1p2Y2lCemFHOXlkQ0J0WlhOellXZGxJR3hsYm1kMGFGeHVYRzRnSUNBZ0lDQWdJQzh2SUhkeWFYUmxJSFJvWlNCdFpYTnpZV2RsSUdScGNtVmpkR3g1SUhSdklIUm9aU0JpZFdabVpYSWdZVzVrSUhObFpTQm9iM2NnYlhWamFDQjNZWE1nZDNKcGRIUmxibHh1SUNBZ0lDQWdJQ0IyWVhJZ2MzUmhjblJRYjNNZ1BTQjBhR2x6TG5CdmN6dGNiaUFnSUNBZ0lDQWdabTRvYjJKcUxDQjBhR2x6S1R0Y2JpQWdJQ0FnSUNBZ2RtRnlJR3hsYmlBOUlIUm9hWE11Y0c5eklDMGdjM1JoY25SUWIzTTdYRzVjYmlBZ0lDQWdJQ0FnZG1GeUlIWmhjbWx1ZEV4bGJpQTlYRzRnSUNBZ0lDQWdJQ0FnSUNCc1pXNGdQRDBnTUhnM1ppQS9JREVnT2x4dUlDQWdJQ0FnSUNBZ0lDQWdiR1Z1SUR3OUlEQjRNMlptWmlBL0lESWdPbHh1SUNBZ0lDQWdJQ0FnSUNBZ2JHVnVJRHc5SURCNE1XWm1abVptSUQ4Z015QTZYRzRnSUNBZ0lDQWdJQ0FnSUNCc1pXNGdQRDBnTUhobVptWm1abVptSUQ4Z05DQTZJRTFoZEdndVkyVnBiQ2hOWVhSb0xteHZaeWhzWlc0cElDOGdLRTFoZEdndVRFNHlJQ29nTnlrcE8xeHVYRzRnSUNBZ0lDQWdJQzh2SUdsbUlERWdZbmwwWlNCcGMyNG5kQ0JsYm05MVoyZ2dabTl5SUdWdVkyOWthVzVuSUcxbGMzTmhaMlVnYkdWdVozUm9MQ0J6YUdsbWRDQjBhR1VnWkdGMFlTQjBieUIwYUdVZ2NtbG5hSFJjYmlBZ0lDQWdJQ0FnYVdZZ0tIWmhjbWx1ZEV4bGJpQStJREVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVmhiR3h2WXloMllYSnBiblJNWlc0Z0xTQXhLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHWnZjaUFvZG1GeUlHa2dQU0IwYUdsekxuQnZjeUF0SURFN0lHa2dQajBnYzNSaGNuUlFiM003SUdrdExTa2dkR2hwY3k1aWRXWmJhU0FySUhaaGNtbHVkRXhsYmlBdElERmRJRDBnZEdocGN5NWlkV1piYVYwN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0F2THlCbWFXNWhiR3g1TENCM2NtbDBaU0IwYUdVZ2JXVnpjMkZuWlNCc1pXNW5kR2dnYVc0Z2RHaGxJSEpsYzJWeWRtVmtJSEJzWVdObElHRnVaQ0J5WlhOMGIzSmxJSFJvWlNCd2IzTnBkR2x2Ymx4dUlDQWdJQ0FnSUNCMGFHbHpMbkJ2Y3lBOUlITjBZWEowVUc5eklDMGdNVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NTNjbWwwWlZaaGNtbHVkQ2hzWlc0cE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5CdmN5QXJQU0JzWlc0N1hHNGdJQ0FnZlN4Y2JseHVJQ0FnSUhkeWFYUmxUV1Z6YzJGblpUb2dablZ1WTNScGIyNG9kR0ZuTENCbWJpd2diMkpxS1NCN1hHNGdJQ0FnSUNBZ0lIUm9hWE11ZDNKcGRHVlVZV2NvZEdGbkxDQlFZbVl1UW5sMFpYTXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHlhWFJsVW1GM1RXVnpjMkZuWlNobWJpd2diMkpxS1R0Y2JpQWdJQ0I5TEZ4dVhHNGdJQ0FnZDNKcGRHVlFZV05yWldSV1lYSnBiblE2SUNBZ1puVnVZM1JwYjI0b2RHRm5MQ0JoY25JcElIc2dkR2hwY3k1M2NtbDBaVTFsYzNOaFoyVW9kR0ZuTENCM2NtbDBaVkJoWTJ0bFpGWmhjbWx1ZEN3Z1lYSnlLVHNnSUNCOUxGeHVJQ0FnSUhkeWFYUmxVR0ZqYTJWa1UxWmhjbWx1ZERvZ0lHWjFibU4wYVc5dUtIUmhaeXdnWVhKeUtTQjdJSFJvYVhNdWQzSnBkR1ZOWlhOellXZGxLSFJoWnl3Z2QzSnBkR1ZRWVdOclpXUlRWbUZ5YVc1MExDQmhjbklwT3lBZ2ZTeGNiaUFnSUNCM2NtbDBaVkJoWTJ0bFpFSnZiMnhsWVc0NklDQm1kVzVqZEdsdmJpaDBZV2NzSUdGeWNpa2dleUIwYUdsekxuZHlhWFJsVFdWemMyRm5aU2gwWVdjc0lIZHlhWFJsVUdGamEyVmtRbTl2YkdWaGJpd2dZWEp5S1RzZ0lIMHNYRzRnSUNBZ2QzSnBkR1ZRWVdOclpXUkdiRzloZERvZ0lDQWdablZ1WTNScGIyNG9kR0ZuTENCaGNuSXBJSHNnZEdocGN5NTNjbWwwWlUxbGMzTmhaMlVvZEdGbkxDQjNjbWwwWlZCaFkydGxaRVpzYjJGMExDQmhjbklwT3lBZ0lDQjlMRnh1SUNBZ0lIZHlhWFJsVUdGamEyVmtSRzkxWW14bE9pQWdJR1oxYm1OMGFXOXVLSFJoWnl3Z1lYSnlLU0I3SUhSb2FYTXVkM0pwZEdWTlpYTnpZV2RsS0hSaFp5d2dkM0pwZEdWUVlXTnJaV1JFYjNWaWJHVXNJR0Z5Y2lrN0lDQWdmU3hjYmlBZ0lDQjNjbWwwWlZCaFkydGxaRVpwZUdWa016STZJQ0JtZFc1amRHbHZiaWgwWVdjc0lHRnljaWtnZXlCMGFHbHpMbmR5YVhSbFRXVnpjMkZuWlNoMFlXY3NJSGR5YVhSbFVHRmphMlZrUm1sNFpXUXpNaXdnWVhKeUtUc2dJSDBzWEc0Z0lDQWdkM0pwZEdWUVlXTnJaV1JUUm1sNFpXUXpNam9nWm5WdVkzUnBiMjRvZEdGbkxDQmhjbklwSUhzZ2RHaHBjeTUzY21sMFpVMWxjM05oWjJVb2RHRm5MQ0IzY21sMFpWQmhZMnRsWkZOR2FYaGxaRE15TENCaGNuSXBPeUI5TEZ4dUlDQWdJSGR5YVhSbFVHRmphMlZrUm1sNFpXUTJORG9nSUdaMWJtTjBhVzl1S0hSaFp5d2dZWEp5S1NCN0lIUm9hWE11ZDNKcGRHVk5aWE56WVdkbEtIUmhaeXdnZDNKcGRHVlFZV05yWldSR2FYaGxaRFkwTENCaGNuSXBPeUFnZlN4Y2JpQWdJQ0IzY21sMFpWQmhZMnRsWkZOR2FYaGxaRFkwT2lCbWRXNWpkR2x2YmloMFlXY3NJR0Z5Y2lrZ2V5QjBhR2x6TG5keWFYUmxUV1Z6YzJGblpTaDBZV2NzSUhkeWFYUmxVR0ZqYTJWa1UwWnBlR1ZrTmpRc0lHRnljaWs3SUgwc1hHNWNiaUFnSUNCM2NtbDBaVUo1ZEdWelJtbGxiR1E2SUdaMWJtTjBhVzl1S0hSaFp5d2dZblZtWm1WeUtTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdWQzSnBkR1ZVWVdjb2RHRm5MQ0JRWW1ZdVFubDBaWE1wTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbmR5YVhSbFFubDBaWE1vWW5WbVptVnlLVHRjYmlBZ0lDQjlMRnh1SUNBZ0lIZHlhWFJsUm1sNFpXUXpNa1pwWld4a09pQm1kVzVqZEdsdmJpaDBZV2NzSUhaaGJDa2dlMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHlhWFJsVkdGbktIUmhaeXdnVUdKbUxrWnBlR1ZrTXpJcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5keWFYUmxSbWw0WldRek1paDJZV3dwTzF4dUlDQWdJSDBzWEc0Z0lDQWdkM0pwZEdWVFJtbDRaV1F6TWtacFpXeGtPaUJtZFc1amRHbHZiaWgwWVdjc0lIWmhiQ2tnZTF4dUlDQWdJQ0FnSUNCMGFHbHpMbmR5YVhSbFZHRm5LSFJoWnl3Z1VHSm1Ma1pwZUdWa016SXBPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHlhWFJsVTBacGVHVmtNeklvZG1Gc0tUdGNiaUFnSUNCOUxGeHVJQ0FnSUhkeWFYUmxSbWw0WldRMk5FWnBaV3hrT2lCbWRXNWpkR2x2YmloMFlXY3NJSFpoYkNrZ2UxeHVJQ0FnSUNBZ0lDQjBhR2x6TG5keWFYUmxWR0ZuS0hSaFp5d2dVR0ptTGtacGVHVmtOalFwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbmR5YVhSbFJtbDRaV1EyTkNoMllXd3BPMXh1SUNBZ0lIMHNYRzRnSUNBZ2QzSnBkR1ZUUm1sNFpXUTJORVpwWld4a09pQm1kVzVqZEdsdmJpaDBZV2NzSUhaaGJDa2dlMXh1SUNBZ0lDQWdJQ0IwYUdsekxuZHlhWFJsVkdGbktIUmhaeXdnVUdKbUxrWnBlR1ZrTmpRcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5keWFYUmxVMFpwZUdWa05qUW9kbUZzS1R0Y2JpQWdJQ0I5TEZ4dUlDQWdJSGR5YVhSbFZtRnlhVzUwUm1sbGJHUTZJR1oxYm1OMGFXOXVLSFJoWnl3Z2RtRnNLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVkM0pwZEdWVVlXY29kR0ZuTENCUVltWXVWbUZ5YVc1MEtUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1M2NtbDBaVlpoY21sdWRDaDJZV3dwTzF4dUlDQWdJSDBzWEc0Z0lDQWdkM0pwZEdWVFZtRnlhVzUwUm1sbGJHUTZJR1oxYm1OMGFXOXVLSFJoWnl3Z2RtRnNLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVkM0pwZEdWVVlXY29kR0ZuTENCUVltWXVWbUZ5YVc1MEtUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1M2NtbDBaVk5XWVhKcGJuUW9kbUZzS1R0Y2JpQWdJQ0I5TEZ4dUlDQWdJSGR5YVhSbFUzUnlhVzVuUm1sbGJHUTZJR1oxYm1OMGFXOXVLSFJoWnl3Z2MzUnlLU0I3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVkM0pwZEdWVVlXY29kR0ZuTENCUVltWXVRbmwwWlhNcE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5keWFYUmxVM1J5YVc1bktITjBjaWs3WEc0Z0lDQWdmU3hjYmlBZ0lDQjNjbWwwWlVac2IyRjBSbWxsYkdRNklHWjFibU4wYVc5dUtIUmhaeXdnZG1Gc0tTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdWQzSnBkR1ZVWVdjb2RHRm5MQ0JRWW1ZdVJtbDRaV1F6TWlrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11ZDNKcGRHVkdiRzloZENoMllXd3BPMXh1SUNBZ0lIMHNYRzRnSUNBZ2QzSnBkR1ZFYjNWaWJHVkdhV1ZzWkRvZ1puVnVZM1JwYjI0b2RHRm5MQ0IyWVd3cElIdGNiaUFnSUNBZ0lDQWdkR2hwY3k1M2NtbDBaVlJoWnloMFlXY3NJRkJpWmk1R2FYaGxaRFkwS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTUzY21sMFpVUnZkV0pzWlNoMllXd3BPMXh1SUNBZ0lIMHNYRzRnSUNBZ2QzSnBkR1ZDYjI5c1pXRnVSbWxsYkdRNklHWjFibU4wYVc5dUtIUmhaeXdnZG1Gc0tTQjdYRzRnSUNBZ0lDQWdJSFJvYVhNdWQzSnBkR1ZXWVhKcGJuUkdhV1ZzWkNoMFlXY3NJRUp2YjJ4bFlXNG9kbUZzS1NrN1hHNGdJQ0FnZlZ4dWZUdGNibHh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSV1lYSnBiblFvWVhKeUxDQndZbVlwSUNBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxWbUZ5YVc1MEtHRnljbHRwWFNrN0lDQWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSVFZtRnlhVzUwS0dGeWNpd2djR0ptS1NBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxVMVpoY21sdWRDaGhjbkpiYVYwcE95QWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSR2JHOWhkQ2hoY25Jc0lIQmlaaWtnSUNBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxSbXh2WVhRb1lYSnlXMmxkS1RzZ0lDQWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSRWIzVmliR1VvWVhKeUxDQndZbVlwSUNBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxSRzkxWW14bEtHRnljbHRwWFNrN0lDQWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSQ2IyOXNaV0Z1S0dGeWNpd2djR0ptS1NBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxRbTl2YkdWaGJpaGhjbkpiYVYwcE95QWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSR2FYaGxaRE15S0dGeWNpd2djR0ptS1NBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxSbWw0WldRek1paGhjbkpiYVYwcE95QWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSVFJtbDRaV1F6TWloaGNuSXNJSEJpWmlrZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxVMFpwZUdWa016SW9ZWEp5VzJsZEtUc2dmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSR2FYaGxaRFkwS0dGeWNpd2djR0ptS1NBZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxSbWw0WldRMk5DaGhjbkpiYVYwcE95QWdmVnh1Wm5WdVkzUnBiMjRnZDNKcGRHVlFZV05yWldSVFJtbDRaV1EyTkNoaGNuSXNJSEJpWmlrZ2V5Qm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR0Z5Y2k1c1pXNW5kR2c3SUdrckt5a2djR0ptTG5keWFYUmxVMFpwZUdWa05qUW9ZWEp5VzJsZEtUc2dmVnh1SWwxOSIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IGUgKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKHZhbHVlICogYyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50O1xuXG5mdW5jdGlvbiBQb2ludCh4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xufVxuXG5Qb2ludC5wcm90b3R5cGUgPSB7XG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IFBvaW50KHRoaXMueCwgdGhpcy55KTsgfSxcblxuICAgIGFkZDogICAgIGZ1bmN0aW9uKHApIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fYWRkKHApOyAgICAgfSxcbiAgICBzdWI6ICAgICBmdW5jdGlvbihwKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3N1YihwKTsgICAgIH0sXG4gICAgbXVsdDogICAgZnVuY3Rpb24oaykgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9tdWx0KGspOyAgICB9LFxuICAgIGRpdjogICAgIGZ1bmN0aW9uKGspIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fZGl2KGspOyAgICAgfSxcbiAgICByb3RhdGU6ICBmdW5jdGlvbihhKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3JvdGF0ZShhKTsgIH0sXG4gICAgbWF0TXVsdDogZnVuY3Rpb24obSkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9tYXRNdWx0KG0pOyB9LFxuICAgIHVuaXQ6ICAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl91bml0KCk7IH0sXG4gICAgcGVycDogICAgZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3BlcnAoKTsgfSxcbiAgICByb3VuZDogICBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fcm91bmQoKTsgfSxcblxuICAgIG1hZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcbiAgICB9LFxuXG4gICAgZXF1YWxzOiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnggPT09IHAueCAmJlxuICAgICAgICAgICAgICAgdGhpcy55ID09PSBwLnk7XG4gICAgfSxcblxuICAgIGRpc3Q6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmRpc3RTcXIocCkpO1xuICAgIH0sXG5cbiAgICBkaXN0U3FyOiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHZhciBkeCA9IHAueCAtIHRoaXMueCxcbiAgICAgICAgICAgIGR5ID0gcC55IC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG4gICAgfSxcblxuICAgIGFuZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy55LCB0aGlzLngpO1xuICAgIH0sXG5cbiAgICBhbmdsZVRvOiBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMueSAtIGIueSwgdGhpcy54IC0gYi54KTtcbiAgICB9LFxuXG4gICAgYW5nbGVXaXRoOiBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFuZ2xlV2l0aFNlcChiLngsIGIueSk7XG4gICAgfSxcblxuICAgIC8vIEZpbmQgdGhlIGFuZ2xlIG9mIHRoZSB0d28gdmVjdG9ycywgc29sdmluZyB0aGUgZm9ybXVsYSBmb3IgdGhlIGNyb3NzIHByb2R1Y3QgYSB4IGIgPSB8YXx8YnxzaW4ozrgpIGZvciDOuC5cbiAgICBhbmdsZVdpdGhTZXA6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIoXG4gICAgICAgICAgICB0aGlzLnggKiB5IC0gdGhpcy55ICogeCxcbiAgICAgICAgICAgIHRoaXMueCAqIHggKyB0aGlzLnkgKiB5KTtcbiAgICB9LFxuXG4gICAgX21hdE11bHQ6IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgdmFyIHggPSBtWzBdICogdGhpcy54ICsgbVsxXSAqIHRoaXMueSxcbiAgICAgICAgICAgIHkgPSBtWzJdICogdGhpcy54ICsgbVszXSAqIHRoaXMueTtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9hZGQ6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgdGhpcy54ICs9IHAueDtcbiAgICAgICAgdGhpcy55ICs9IHAueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9zdWI6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgdGhpcy54IC09IHAueDtcbiAgICAgICAgdGhpcy55IC09IHAueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9tdWx0OiBmdW5jdGlvbihrKSB7XG4gICAgICAgIHRoaXMueCAqPSBrO1xuICAgICAgICB0aGlzLnkgKj0gaztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9kaXY6IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgdGhpcy54IC89IGs7XG4gICAgICAgIHRoaXMueSAvPSBrO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3VuaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9kaXYodGhpcy5tYWcoKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfcGVycDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB0aGlzLnkgPSB0aGlzLng7XG4gICAgICAgIHRoaXMueCA9IC15O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3JvdGF0ZTogZnVuY3Rpb24oYW5nbGUpIHtcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luKGFuZ2xlKSxcbiAgICAgICAgICAgIHggPSBjb3MgKiB0aGlzLnggLSBzaW4gKiB0aGlzLnksXG4gICAgICAgICAgICB5ID0gc2luICogdGhpcy54ICsgY29zICogdGhpcy55O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3JvdW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy54ID0gTWF0aC5yb3VuZCh0aGlzLngpO1xuICAgICAgICB0aGlzLnkgPSBNYXRoLnJvdW5kKHRoaXMueSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbi8vIGNvbnN0cnVjdHMgUG9pbnQgZnJvbSBhbiBhcnJheSBpZiBuZWNlc3NhcnlcblBvaW50LmNvbnZlcnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIGlmIChhIGluc3RhbmNlb2YgUG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoYVswXSwgYVsxXSk7XG4gICAgfVxuICAgIHJldHVybiBhO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzLlZlY3RvclRpbGUgPSByZXF1aXJlKCcuL2xpYi92ZWN0b3J0aWxlLmpzJyk7XG5tb2R1bGUuZXhwb3J0cy5WZWN0b3JUaWxlRmVhdHVyZSA9IHJlcXVpcmUoJy4vbGliL3ZlY3RvcnRpbGVmZWF0dXJlLmpzJyk7XG5tb2R1bGUuZXhwb3J0cy5WZWN0b3JUaWxlTGF5ZXIgPSByZXF1aXJlKCcuL2xpYi92ZWN0b3J0aWxlbGF5ZXIuanMnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFZlY3RvclRpbGVMYXllciA9IHJlcXVpcmUoJy4vdmVjdG9ydGlsZWxheWVyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yVGlsZTtcblxuZnVuY3Rpb24gVmVjdG9yVGlsZShwYmYsIGVuZCkge1xuICAgIHRoaXMubGF5ZXJzID0gcGJmLnJlYWRGaWVsZHMocmVhZFRpbGUsIHt9LCBlbmQpO1xufVxuXG5mdW5jdGlvbiByZWFkVGlsZSh0YWcsIGxheWVycywgcGJmKSB7XG4gICAgaWYgKHRhZyA9PT0gMykge1xuICAgICAgICB2YXIgbGF5ZXIgPSBuZXcgVmVjdG9yVGlsZUxheWVyKHBiZiwgcGJmLnJlYWRWYXJpbnQoKSArIHBiZi5wb3MpO1xuICAgICAgICBpZiAobGF5ZXIubGVuZ3RoKSBsYXllcnNbbGF5ZXIubmFtZV0gPSBsYXllcjtcbiAgICB9XG59XG5cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFBvaW50ID0gcmVxdWlyZSgncG9pbnQtZ2VvbWV0cnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3JUaWxlRmVhdHVyZTtcblxuZnVuY3Rpb24gVmVjdG9yVGlsZUZlYXR1cmUocGJmLCBlbmQsIGV4dGVudCwga2V5cywgdmFsdWVzKSB7XG4gICAgLy8gUHVibGljXG4gICAgdGhpcy5wcm9wZXJ0aWVzID0ge307XG4gICAgdGhpcy5leHRlbnQgPSBleHRlbnQ7XG4gICAgdGhpcy50eXBlID0gMDtcblxuICAgIC8vIFByaXZhdGVcbiAgICB0aGlzLl9wYmYgPSBwYmY7XG4gICAgdGhpcy5fZ2VvbWV0cnkgPSAtMTtcbiAgICB0aGlzLl9rZXlzID0ga2V5cztcbiAgICB0aGlzLl92YWx1ZXMgPSB2YWx1ZXM7XG5cbiAgICBwYmYucmVhZEZpZWxkcyhyZWFkRmVhdHVyZSwgdGhpcywgZW5kKTtcbn1cblxuZnVuY3Rpb24gcmVhZEZlYXR1cmUodGFnLCBmZWF0dXJlLCBwYmYpIHtcbiAgICBpZiAodGFnID09IDEpIGZlYXR1cmUuX2lkID0gcGJmLnJlYWRWYXJpbnQoKTtcbiAgICBlbHNlIGlmICh0YWcgPT0gMikgcmVhZFRhZyhwYmYsIGZlYXR1cmUpO1xuICAgIGVsc2UgaWYgKHRhZyA9PSAzKSBmZWF0dXJlLnR5cGUgPSBwYmYucmVhZFZhcmludCgpO1xuICAgIGVsc2UgaWYgKHRhZyA9PSA0KSBmZWF0dXJlLl9nZW9tZXRyeSA9IHBiZi5wb3M7XG59XG5cbmZ1bmN0aW9uIHJlYWRUYWcocGJmLCBmZWF0dXJlKSB7XG4gICAgdmFyIGVuZCA9IHBiZi5yZWFkVmFyaW50KCkgKyBwYmYucG9zO1xuXG4gICAgd2hpbGUgKHBiZi5wb3MgPCBlbmQpIHtcbiAgICAgICAgdmFyIGtleSA9IGZlYXR1cmUuX2tleXNbcGJmLnJlYWRWYXJpbnQoKV0sXG4gICAgICAgICAgICB2YWx1ZSA9IGZlYXR1cmUuX3ZhbHVlc1twYmYucmVhZFZhcmludCgpXTtcbiAgICAgICAgZmVhdHVyZS5wcm9wZXJ0aWVzW2tleV0gPSB2YWx1ZTtcbiAgICB9XG59XG5cblZlY3RvclRpbGVGZWF0dXJlLnR5cGVzID0gWydVbmtub3duJywgJ1BvaW50JywgJ0xpbmVTdHJpbmcnLCAnUG9seWdvbiddO1xuXG5WZWN0b3JUaWxlRmVhdHVyZS5wcm90b3R5cGUubG9hZEdlb21ldHJ5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBiZiA9IHRoaXMuX3BiZjtcbiAgICBwYmYucG9zID0gdGhpcy5fZ2VvbWV0cnk7XG5cbiAgICB2YXIgZW5kID0gcGJmLnJlYWRWYXJpbnQoKSArIHBiZi5wb3MsXG4gICAgICAgIGNtZCA9IDEsXG4gICAgICAgIGxlbmd0aCA9IDAsXG4gICAgICAgIHggPSAwLFxuICAgICAgICB5ID0gMCxcbiAgICAgICAgbGluZXMgPSBbXSxcbiAgICAgICAgbGluZTtcblxuICAgIHdoaWxlIChwYmYucG9zIDwgZW5kKSB7XG4gICAgICAgIGlmICghbGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgY21kTGVuID0gcGJmLnJlYWRWYXJpbnQoKTtcbiAgICAgICAgICAgIGNtZCA9IGNtZExlbiAmIDB4NztcbiAgICAgICAgICAgIGxlbmd0aCA9IGNtZExlbiA+PiAzO1xuICAgICAgICB9XG5cbiAgICAgICAgbGVuZ3RoLS07XG5cbiAgICAgICAgaWYgKGNtZCA9PT0gMSB8fCBjbWQgPT09IDIpIHtcbiAgICAgICAgICAgIHggKz0gcGJmLnJlYWRTVmFyaW50KCk7XG4gICAgICAgICAgICB5ICs9IHBiZi5yZWFkU1ZhcmludCgpO1xuXG4gICAgICAgICAgICBpZiAoY21kID09PSAxKSB7IC8vIG1vdmVUb1xuICAgICAgICAgICAgICAgIGlmIChsaW5lKSBsaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICAgICAgICAgIGxpbmUgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGluZS5wdXNoKG5ldyBQb2ludCh4LCB5KSk7XG5cbiAgICAgICAgfSBlbHNlIGlmIChjbWQgPT09IDcpIHtcblxuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL21hcGJveC9tYXBuaWstdmVjdG9yLXRpbGUvaXNzdWVzLzkwXG4gICAgICAgICAgICBpZiAobGluZSkge1xuICAgICAgICAgICAgICAgIGxpbmUucHVzaChsaW5lWzBdLmNsb25lKCkpOyAvLyBjbG9zZVBvbHlnb25cbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGNvbW1hbmQgJyArIGNtZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobGluZSkgbGluZXMucHVzaChsaW5lKTtcblxuICAgIHJldHVybiBsaW5lcztcbn07XG5cblZlY3RvclRpbGVGZWF0dXJlLnByb3RvdHlwZS5iYm94ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBiZiA9IHRoaXMuX3BiZjtcbiAgICBwYmYucG9zID0gdGhpcy5fZ2VvbWV0cnk7XG5cbiAgICB2YXIgZW5kID0gcGJmLnJlYWRWYXJpbnQoKSArIHBiZi5wb3MsXG4gICAgICAgIGNtZCA9IDEsXG4gICAgICAgIGxlbmd0aCA9IDAsXG4gICAgICAgIHggPSAwLFxuICAgICAgICB5ID0gMCxcbiAgICAgICAgeDEgPSBJbmZpbml0eSxcbiAgICAgICAgeDIgPSAtSW5maW5pdHksXG4gICAgICAgIHkxID0gSW5maW5pdHksXG4gICAgICAgIHkyID0gLUluZmluaXR5O1xuXG4gICAgd2hpbGUgKHBiZi5wb3MgPCBlbmQpIHtcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBjbWRMZW4gPSBwYmYucmVhZFZhcmludCgpO1xuICAgICAgICAgICAgY21kID0gY21kTGVuICYgMHg3O1xuICAgICAgICAgICAgbGVuZ3RoID0gY21kTGVuID4+IDM7XG4gICAgICAgIH1cblxuICAgICAgICBsZW5ndGgtLTtcblxuICAgICAgICBpZiAoY21kID09PSAxIHx8IGNtZCA9PT0gMikge1xuICAgICAgICAgICAgeCArPSBwYmYucmVhZFNWYXJpbnQoKTtcbiAgICAgICAgICAgIHkgKz0gcGJmLnJlYWRTVmFyaW50KCk7XG4gICAgICAgICAgICBpZiAoeCA8IHgxKSB4MSA9IHg7XG4gICAgICAgICAgICBpZiAoeCA+IHgyKSB4MiA9IHg7XG4gICAgICAgICAgICBpZiAoeSA8IHkxKSB5MSA9IHk7XG4gICAgICAgICAgICBpZiAoeSA+IHkyKSB5MiA9IHk7XG5cbiAgICAgICAgfSBlbHNlIGlmIChjbWQgIT09IDcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBjb21tYW5kICcgKyBjbWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFt4MSwgeTEsIHgyLCB5Ml07XG59O1xuXG5WZWN0b3JUaWxlRmVhdHVyZS5wcm90b3R5cGUudG9HZW9KU09OID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgIHZhciBzaXplID0gdGhpcy5leHRlbnQgKiBNYXRoLnBvdygyLCB6KSxcbiAgICAgICAgeDAgPSB0aGlzLmV4dGVudCAqIHgsXG4gICAgICAgIHkwID0gdGhpcy5leHRlbnQgKiB5LFxuICAgICAgICBjb29yZHMgPSB0aGlzLmxvYWRHZW9tZXRyeSgpLFxuICAgICAgICB0eXBlID0gVmVjdG9yVGlsZUZlYXR1cmUudHlwZXNbdGhpcy50eXBlXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBsaW5lID0gY29vcmRzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gbGluZVtqXSwgeTIgPSAxODAgLSAocC55ICsgeTApICogMzYwIC8gc2l6ZTtcbiAgICAgICAgICAgIGxpbmVbal0gPSBbXG4gICAgICAgICAgICAgICAgKHAueCArIHgwKSAqIDM2MCAvIHNpemUgLSAxODAsXG4gICAgICAgICAgICAgICAgMzYwIC8gTWF0aC5QSSAqIE1hdGguYXRhbihNYXRoLmV4cCh5MiAqIE1hdGguUEkgLyAxODApKSAtIDkwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICdQb2ludCcgJiYgY29vcmRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBjb29yZHMgPSBjb29yZHNbMF1bMF07XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnUG9pbnQnKSB7XG4gICAgICAgIGNvb3JkcyA9IGNvb3Jkc1swXTtcbiAgICAgICAgdHlwZSA9ICdNdWx0aVBvaW50JztcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdMaW5lU3RyaW5nJyAmJiBjb29yZHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGNvb3JkcyA9IGNvb3Jkc1swXTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdMaW5lU3RyaW5nJykge1xuICAgICAgICB0eXBlID0gJ011bHRpTGluZVN0cmluZyc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogXCJGZWF0dXJlXCIsXG4gICAgICAgIGdlb21ldHJ5OiB7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IGNvb3Jkc1xuICAgICAgICB9LFxuICAgICAgICBwcm9wZXJ0aWVzOiB0aGlzLnByb3BlcnRpZXNcbiAgICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFZlY3RvclRpbGVGZWF0dXJlID0gcmVxdWlyZSgnLi92ZWN0b3J0aWxlZmVhdHVyZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvclRpbGVMYXllcjtcblxuZnVuY3Rpb24gVmVjdG9yVGlsZUxheWVyKHBiZiwgZW5kKSB7XG4gICAgLy8gUHVibGljXG4gICAgdGhpcy52ZXJzaW9uID0gMTtcbiAgICB0aGlzLm5hbWUgPSBudWxsO1xuICAgIHRoaXMuZXh0ZW50ID0gNDA5NjtcbiAgICB0aGlzLmxlbmd0aCA9IDA7XG5cbiAgICAvLyBQcml2YXRlXG4gICAgdGhpcy5fcGJmID0gcGJmO1xuICAgIHRoaXMuX2tleXMgPSBbXTtcbiAgICB0aGlzLl92YWx1ZXMgPSBbXTtcbiAgICB0aGlzLl9mZWF0dXJlcyA9IFtdO1xuXG4gICAgcGJmLnJlYWRGaWVsZHMocmVhZExheWVyLCB0aGlzLCBlbmQpO1xuXG4gICAgdGhpcy5sZW5ndGggPSB0aGlzLl9mZWF0dXJlcy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIHJlYWRMYXllcih0YWcsIGxheWVyLCBwYmYpIHtcbiAgICBpZiAodGFnID09PSAxNSkgbGF5ZXIudmVyc2lvbiA9IHBiZi5yZWFkVmFyaW50KCk7XG4gICAgZWxzZSBpZiAodGFnID09PSAxKSBsYXllci5uYW1lID0gcGJmLnJlYWRTdHJpbmcoKTtcbiAgICBlbHNlIGlmICh0YWcgPT09IDUpIGxheWVyLmV4dGVudCA9IHBiZi5yZWFkVmFyaW50KCk7XG4gICAgZWxzZSBpZiAodGFnID09PSAyKSBsYXllci5fZmVhdHVyZXMucHVzaChwYmYucG9zKTtcbiAgICBlbHNlIGlmICh0YWcgPT09IDMpIGxheWVyLl9rZXlzLnB1c2gocGJmLnJlYWRTdHJpbmcoKSk7XG4gICAgZWxzZSBpZiAodGFnID09PSA0KSBsYXllci5fdmFsdWVzLnB1c2gocmVhZFZhbHVlTWVzc2FnZShwYmYpKTtcbn1cblxuZnVuY3Rpb24gcmVhZFZhbHVlTWVzc2FnZShwYmYpIHtcbiAgICB2YXIgdmFsdWUgPSBudWxsLFxuICAgICAgICBlbmQgPSBwYmYucmVhZFZhcmludCgpICsgcGJmLnBvcztcblxuICAgIHdoaWxlIChwYmYucG9zIDwgZW5kKSB7XG4gICAgICAgIHZhciB0YWcgPSBwYmYucmVhZFZhcmludCgpID4+IDM7XG5cbiAgICAgICAgdmFsdWUgPSB0YWcgPT09IDEgPyBwYmYucmVhZFN0cmluZygpIDpcbiAgICAgICAgICAgIHRhZyA9PT0gMiA/IHBiZi5yZWFkRmxvYXQoKSA6XG4gICAgICAgICAgICB0YWcgPT09IDMgPyBwYmYucmVhZERvdWJsZSgpIDpcbiAgICAgICAgICAgIHRhZyA9PT0gNCA/IHBiZi5yZWFkVmFyaW50NjQoKSA6XG4gICAgICAgICAgICB0YWcgPT09IDUgPyBwYmYucmVhZFZhcmludCgpIDpcbiAgICAgICAgICAgIHRhZyA9PT0gNiA/IHBiZi5yZWFkU1ZhcmludCgpIDpcbiAgICAgICAgICAgIHRhZyA9PT0gNyA/IHBiZi5yZWFkQm9vbGVhbigpIDogbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIHJldHVybiBmZWF0dXJlIGBpYCBmcm9tIHRoaXMgbGF5ZXIgYXMgYSBgVmVjdG9yVGlsZUZlYXR1cmVgXG5WZWN0b3JUaWxlTGF5ZXIucHJvdG90eXBlLmZlYXR1cmUgPSBmdW5jdGlvbihpKSB7XG4gICAgaWYgKGkgPCAwIHx8IGkgPj0gdGhpcy5fZmVhdHVyZXMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoJ2ZlYXR1cmUgaW5kZXggb3V0IG9mIGJvdW5kcycpO1xuXG4gICAgdGhpcy5fcGJmLnBvcyA9IHRoaXMuX2ZlYXR1cmVzW2ldO1xuXG4gICAgdmFyIGVuZCA9IHRoaXMuX3BiZi5yZWFkVmFyaW50KCkgKyB0aGlzLl9wYmYucG9zO1xuICAgIHJldHVybiBuZXcgVmVjdG9yVGlsZUZlYXR1cmUodGhpcy5fcGJmLCBlbmQsIHRoaXMuZXh0ZW50LCB0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMpO1xufTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSBSeWFuIFdoaXRsZXksIERhbmllbCBEdWFydGUsIGFuZCBOaWNob2xhcyBIYWxsYWhhblxuICogICAgb24gNi8wMy8xNC5cbiAqL1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL01WVFV0aWwnKTtcbnZhciBTdGF0aWNMYWJlbCA9IHJlcXVpcmUoJy4vU3RhdGljTGFiZWwvU3RhdGljTGFiZWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNVlRGZWF0dXJlO1xuXG5mdW5jdGlvbiBNVlRGZWF0dXJlKG12dExheWVyLCB2dGYsIGN0eCwgaWQsIHN0eWxlKSB7XG4gIGlmICghdnRmKSByZXR1cm4gbnVsbDtcblxuICAvLyBBcHBseSBhbGwgb2YgdGhlIHByb3BlcnRpZXMgb2YgdnRmIHRvIHRoaXMgb2JqZWN0LlxuICBmb3IgKHZhciBrZXkgaW4gdnRmKSB7XG4gICAgdGhpc1trZXldID0gdnRmW2tleV07XG4gIH1cblxuICB0aGlzLm12dExheWVyID0gbXZ0TGF5ZXI7XG4gIHRoaXMubXZ0U291cmNlID0gbXZ0TGF5ZXIubXZ0U291cmNlO1xuICB0aGlzLm1hcCA9IG12dExheWVyLm12dFNvdXJjZS5tYXA7XG5cbiAgdGhpcy5pZCA9IGlkO1xuXG4gIHRoaXMubGF5ZXJMaW5rID0gdGhpcy5tdnRTb3VyY2UubGF5ZXJMaW5rO1xuICB0aGlzLnRvZ2dsZUVuYWJsZWQgPSB0cnVlO1xuICB0aGlzLnNlbGVjdGVkID0gZmFsc2U7XG5cbiAgLy8gaG93IG11Y2ggd2UgZGl2aWRlIHRoZSBjb29yZGluYXRlIGZyb20gdGhlIHZlY3RvciB0aWxlXG4gIHRoaXMuZGl2aXNvciA9IHZ0Zi5leHRlbnQgLyBjdHgudGlsZVNpemU7XG4gIHRoaXMuZXh0ZW50ID0gdnRmLmV4dGVudDtcbiAgdGhpcy50aWxlU2l6ZSA9IGN0eC50aWxlU2l6ZTtcblxuICAvL0FuIG9iamVjdCB0byBzdG9yZSB0aGUgcGF0aHMgYW5kIGNvbnRleHRzIGZvciB0aGlzIGZlYXR1cmVcbiAgdGhpcy50aWxlcyA9IHt9O1xuXG4gIHRoaXMuc3R5bGUgPSBzdHlsZTtcblxuICAvL0FkZCB0byB0aGUgY29sbGVjdGlvblxuICB0aGlzLmFkZFRpbGVGZWF0dXJlKHZ0ZiwgY3R4KTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMubWFwLm9uKCd6b29tZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5zdGF0aWNMYWJlbCA9IG51bGw7XG4gIH0pO1xuXG4gIGlmIChzdHlsZSAmJiBzdHlsZS5keW5hbWljTGFiZWwgJiYgdHlwZW9mIHN0eWxlLmR5bmFtaWNMYWJlbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMuZHluYW1pY0xhYmVsID0gdGhpcy5tdnRTb3VyY2UuZHluYW1pY0xhYmVsLmNyZWF0ZUZlYXR1cmUodGhpcyk7XG4gIH1cblxuICBhamF4KHNlbGYpO1xufVxuXG5cbmZ1bmN0aW9uIGFqYXgoc2VsZikge1xuICB2YXIgc3R5bGUgPSBzZWxmLnN0eWxlO1xuICBpZiAoc3R5bGUgJiYgc3R5bGUuYWpheFNvdXJjZSAmJiB0eXBlb2Ygc3R5bGUuYWpheFNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBhamF4RW5kcG9pbnQgPSBzdHlsZS5hamF4U291cmNlKHNlbGYpO1xuICAgIGlmIChhamF4RW5kcG9pbnQpIHtcbiAgICAgIFV0aWwuZ2V0SlNPTihhamF4RW5kcG9pbnQsIGZ1bmN0aW9uKGVycm9yLCByZXNwb25zZSwgYm9keSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyBbJ2FqYXhTb3VyY2UgQUpBWCBFcnJvcicsIGVycm9yXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhamF4Q2FsbGJhY2soc2VsZiwgcmVzcG9uc2UpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBhamF4Q2FsbGJhY2soc2VsZiwgcmVzcG9uc2UpIHtcbiAgc2VsZi5hamF4RGF0YSA9IHJlc3BvbnNlO1xuXG4gIC8qKlxuICAgKiBZb3UgY2FuIGF0dGFjaCBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGEgZmVhdHVyZSBpbiB5b3VyIGFwcFxuICAgKiB0aGF0IHdpbGwgZ2V0IGNhbGxlZCB3aGVuZXZlciBuZXcgYWpheERhdGEgY29tZXMgaW4uIFRoaXNcbiAgICogY2FuIGJlIHVzZWQgdG8gdXBkYXRlIFVJIHRoYXQgbG9va3MgYXQgZGF0YSBmcm9tIHdpdGhpbiBhIGZlYXR1cmUuXG4gICAqXG4gICAqIHNldFN0eWxlIG1heSBwb3NzaWJseSBoYXZlIGEgc3R5bGUgd2l0aCBhIGRpZmZlcmVudCBhamF4RGF0YSBzb3VyY2UsXG4gICAqIGFuZCB5b3Ugd291bGQgcG90ZW50aWFsbHkgZ2V0IG5ldyBjb250ZXh0dWFsIGRhdGEgZm9yIHlvdXIgZmVhdHVyZS5cbiAgICpcbiAgICogVE9ETzogVGhpcyBuZWVkcyB0byBiZSBkb2N1bWVudGVkLlxuICAgKi9cbiAgaWYgKHR5cGVvZiBzZWxmLmFqYXhEYXRhUmVjZWl2ZWQgPT09ICdmdW5jdGlvbicpIHtcbiAgICBzZWxmLmFqYXhEYXRhUmVjZWl2ZWQoc2VsZiwgcmVzcG9uc2UpO1xuICB9XG5cbiAgc2VsZi5fc2V0U3R5bGUoc2VsZi5tdnRMYXllci5zdHlsZSk7XG4gIHJlZHJhd1RpbGVzKHNlbGYpO1xufVxuXG5NVlRGZWF0dXJlLnByb3RvdHlwZS5fc2V0U3R5bGUgPSBmdW5jdGlvbihzdHlsZUZuKSB7XG4gIHRoaXMuc3R5bGUgPSBzdHlsZUZuKHRoaXMsIHRoaXMuYWpheERhdGEpO1xuXG4gIC8vIFRoZSBsYWJlbCBnZXRzIHJlbW92ZWQsIGFuZCB0aGUgKHJlKWRyYXcsXG4gIC8vIHRoYXQgaXMgaW5pdGlhdGVkIGJ5IHRoZSBNVlRMYXllciBjcmVhdGVzIGEgbmV3IGxhYmVsLlxuICB0aGlzLnJlbW92ZUxhYmVsKCk7XG59O1xuXG5NVlRGZWF0dXJlLnByb3RvdHlwZS5zZXRTdHlsZSA9IGZ1bmN0aW9uKHN0eWxlRm4pIHtcbiAgdGhpcy5hamF4RGF0YSA9IG51bGw7XG4gIHRoaXMuc3R5bGUgPSBzdHlsZUZuKHRoaXMsIG51bGwpO1xuICB2YXIgaGFzQWpheFNvdXJjZSA9IGFqYXgodGhpcyk7XG4gIGlmICghaGFzQWpheFNvdXJjZSkge1xuICAgIC8vIFRoZSBsYWJlbCBnZXRzIHJlbW92ZWQsIGFuZCB0aGUgKHJlKWRyYXcsXG4gICAgLy8gdGhhdCBpcyBpbml0aWF0ZWQgYnkgdGhlIE1WVExheWVyIGNyZWF0ZXMgYSBuZXcgbGFiZWwuXG4gICAgdGhpcy5yZW1vdmVMYWJlbCgpO1xuICB9XG59O1xuXG5NVlRGZWF0dXJlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY2FudmFzSUQpIHtcbiAgLy9HZXQgdGhlIGluZm8gZnJvbSB0aGUgdGlsZXMgbGlzdFxuICB2YXIgdGlsZUluZm8gPSAgdGhpcy50aWxlc1tjYW52YXNJRF07XG5cbiAgdmFyIHZ0ZiA9IHRpbGVJbmZvLnZ0ZjtcbiAgdmFyIGN0eCA9IHRpbGVJbmZvLmN0eDtcblxuICAvL0dldCB0aGUgYWN0dWFsIGNhbnZhcyBmcm9tIHRoZSBwYXJlbnQgbGF5ZXIncyBfdGlsZXMgb2JqZWN0LlxuICB2YXIgeHkgPSBjYW52YXNJRC5zcGxpdChcIjpcIikuc2xpY2UoMSwgMykuam9pbihcIjpcIik7XG4gIGN0eC5jYW52YXMgPSB0aGlzLm12dExheWVyLl90aWxlc1t4eV07XG5cbi8vICBUaGlzIGNvdWxkIGJlIHVzZWQgdG8gZGlyZWN0bHkgY29tcHV0ZSB0aGUgc3R5bGUgZnVuY3Rpb24gZnJvbSB0aGUgbGF5ZXIgb24gZXZlcnkgZHJhdy5cbi8vICBUaGlzIGlzIG11Y2ggbGVzcyBlZmZpY2llbnQuLi5cbi8vICB0aGlzLnN0eWxlID0gdGhpcy5tdnRMYXllci5zdHlsZSh0aGlzKTtcblxuICBpZiAodGhpcy5zZWxlY3RlZCkge1xuICAgIHZhciBzdHlsZSA9IHRoaXMuc3R5bGUuc2VsZWN0ZWQgfHwgdGhpcy5zdHlsZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc3R5bGUgPSB0aGlzLnN0eWxlO1xuICB9XG5cbiAgc3dpdGNoICh2dGYudHlwZSkge1xuICAgIGNhc2UgMTogLy9Qb2ludFxuICAgICAgdGhpcy5fZHJhd1BvaW50KGN0eCwgdnRmLmNvb3JkaW5hdGVzLCBzdHlsZSk7XG4gICAgICBpZiAoIXRoaXMuc3RhdGljTGFiZWwgJiYgdHlwZW9mIHRoaXMuc3R5bGUuc3RhdGljTGFiZWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKHRoaXMuc3R5bGUuYWpheFNvdXJjZSAmJiAhdGhpcy5hamF4RGF0YSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2RyYXdTdGF0aWNMYWJlbChjdHgsIHZ0Zi5jb29yZGluYXRlcywgc3R5bGUpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIDI6IC8vTGluZVN0cmluZ1xuICAgICAgdGhpcy5fZHJhd0xpbmVTdHJpbmcoY3R4LCB2dGYuY29vcmRpbmF0ZXMsIHN0eWxlKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSAzOiAvL1BvbHlnb25cbiAgICAgIHRoaXMuX2RyYXdQb2x5Z29uKGN0eCwgdnRmLmNvb3JkaW5hdGVzLCBzdHlsZSk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VubWFuYWdlZCB0eXBlOiAnICsgdnRmLnR5cGUpO1xuICB9XG5cbn07XG5cbk1WVEZlYXR1cmUucHJvdG90eXBlLmdldFBhdGhzRm9yVGlsZSA9IGZ1bmN0aW9uKGNhbnZhc0lEKSB7XG4gIC8vR2V0IHRoZSBpbmZvIGZyb20gdGhlIHBhcnRzIGxpc3RcbiAgcmV0dXJuIHRoaXMudGlsZXNbY2FudmFzSURdLnBhdGhzO1xufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuYWRkVGlsZUZlYXR1cmUgPSBmdW5jdGlvbih2dGYsIGN0eCkge1xuICAvL1N0b3JlIHRoZSBpbXBvcnRhbnQgaXRlbXMgaW4gdGhlIHRpbGVzIGxpc3RcblxuICAvL1dlIG9ubHkgd2FudCB0byBzdG9yZSBpbmZvIGZvciB0aWxlcyBmb3IgdGhlIGN1cnJlbnQgbWFwIHpvb20uICBJZiBpdCBpcyB0aWxlIGluZm8gZm9yIGFub3RoZXIgem9vbSBsZXZlbCwgaWdub3JlIGl0XG4gIC8vQWxzbywgaWYgdGhlcmUgYXJlIGV4aXN0aW5nIHRpbGVzIGluIHRoZSBsaXN0IGZvciBvdGhlciB6b29tIGxldmVscywgZXhwdW5nZSB0aGVtLlxuICB2YXIgem9vbSA9IHRoaXMubWFwLmdldFpvb20oKTtcblxuICBpZihjdHguem9vbSAhPSB6b29tKSByZXR1cm47XG5cbiAgdGhpcy5jbGVhclRpbGVGZWF0dXJlcyh6b29tKTsgLy9UT0RPOiBUaGlzIGl0ZXJhdGVzIHRocnUgYWxsIHRpbGVzIGV2ZXJ5IHRpbWUgYSBuZXcgdGlsZSBpcyBhZGRlZC4gIEZpZ3VyZSBvdXQgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXMuXG5cbiAgdGhpcy50aWxlc1tjdHguaWRdID0ge1xuICAgIGN0eDogY3R4LFxuICAgIHZ0ZjogdnRmLFxuICAgIHBhdGhzOiBbXVxuICB9O1xuXG59O1xuXG5cbi8qKlxuICogQ2xlYXIgdGhlIGlubmVyIGxpc3Qgb2YgdGlsZSBmZWF0dXJlcyBpZiB0aGV5IGRvbid0IG1hdGNoIHRoZSBnaXZlbiB6b29tLlxuICpcbiAqIEBwYXJhbSB6b29tXG4gKi9cbk1WVEZlYXR1cmUucHJvdG90eXBlLmNsZWFyVGlsZUZlYXR1cmVzID0gZnVuY3Rpb24oem9vbSkge1xuICAvL0lmIHN0b3JlZCB0aWxlcyBleGlzdCBmb3Igb3RoZXIgem9vbSBsZXZlbHMsIGV4cHVuZ2UgdGhlbSBmcm9tIHRoZSBsaXN0LlxuICBmb3IgKHZhciBrZXkgaW4gdGhpcy50aWxlcykge1xuICAgICBpZihrZXkuc3BsaXQoXCI6XCIpWzBdICE9IHpvb20pIGRlbGV0ZSB0aGlzLnRpbGVzW2tleV07XG4gIH1cbn07XG5cbi8qKlxuICogUmVkcmF3cyBhbGwgb2YgdGhlIHRpbGVzIGFzc29jaWF0ZWQgd2l0aCBhIGZlYXR1cmUuIFVzZWZ1bCBmb3JcbiAqIHN0eWxlIGNoYW5nZSBhbmQgdG9nZ2xpbmcuXG4gKlxuICogQHBhcmFtIHNlbGZcbiAqL1xuZnVuY3Rpb24gcmVkcmF3VGlsZXMoc2VsZikge1xuICAvL1JlZHJhdyB0aGUgd2hvbGUgdGlsZSwgbm90IGp1c3QgdGhpcyB2dGZcbiAgdmFyIHRpbGVzID0gc2VsZi50aWxlcztcbiAgdmFyIG12dExheWVyID0gc2VsZi5tdnRMYXllcjtcblxuICBmb3IgKHZhciBpZCBpbiB0aWxlcykge1xuICAgIHZhciB0aWxlWm9vbSA9IHBhcnNlSW50KGlkLnNwbGl0KCc6JylbMF0pO1xuICAgIHZhciBtYXBab29tID0gc2VsZi5tYXAuZ2V0Wm9vbSgpO1xuICAgIGlmICh0aWxlWm9vbSA9PT0gbWFwWm9vbSkge1xuICAgICAgLy9SZWRyYXcgdGhlIHRpbGVcbiAgICAgIG12dExheWVyLnJlZHJhd1RpbGUoaWQpO1xuICAgIH1cbiAgfVxufVxuXG5NVlRGZWF0dXJlLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuc2VsZWN0ZWQpIHtcbiAgICB0aGlzLmRlc2VsZWN0KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5zZWxlY3QoKTtcbiAgfVxufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2VsZWN0ZWQgPSB0cnVlO1xuICB0aGlzLm12dFNvdXJjZS5mZWF0dXJlU2VsZWN0ZWQodGhpcyk7XG4gIHJlZHJhd1RpbGVzKHRoaXMpO1xuICB2YXIgbGlua2VkRmVhdHVyZSA9IHRoaXMubGlua2VkRmVhdHVyZSgpO1xuICBpZiAobGlua2VkRmVhdHVyZSAmJiBsaW5rZWRGZWF0dXJlLnN0YXRpY0xhYmVsICYmICFsaW5rZWRGZWF0dXJlLnN0YXRpY0xhYmVsLnNlbGVjdGVkKSB7XG4gICAgbGlua2VkRmVhdHVyZS5zdGF0aWNMYWJlbC5zZWxlY3QoKTtcbiAgfVxufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuZGVzZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xuICB0aGlzLm12dFNvdXJjZS5mZWF0dXJlRGVzZWxlY3RlZCh0aGlzKTtcbiAgcmVkcmF3VGlsZXModGhpcyk7XG4gIHZhciBsaW5rZWRGZWF0dXJlID0gdGhpcy5saW5rZWRGZWF0dXJlKCk7XG4gIGlmIChsaW5rZWRGZWF0dXJlICYmIGxpbmtlZEZlYXR1cmUuc3RhdGljTGFiZWwgJiYgbGlua2VkRmVhdHVyZS5zdGF0aWNMYWJlbC5zZWxlY3RlZCkge1xuICAgIGxpbmtlZEZlYXR1cmUuc3RhdGljTGFiZWwuZGVzZWxlY3QoKTtcbiAgfVxufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIGNhbGxiYWNrKSB7XG4gIHRoaXMuX2V2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSA9IGNhbGxiYWNrO1xufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuX2RyYXdQb2ludCA9IGZ1bmN0aW9uKGN0eCwgY29vcmRzQXJyYXksIHN0eWxlKSB7XG4gIGlmICghc3R5bGUpIHJldHVybjtcbiAgaWYgKCFjdHggfHwgIWN0eC5jYW52YXMpIHJldHVybjtcblxuICB2YXIgdGlsZSA9IHRoaXMudGlsZXNbY3R4LmlkXTtcblxuICAvL0dldCByYWRpdXNcbiAgdmFyIHJhZGl1cyA9IDE7XG4gIGlmICh0eXBlb2Ygc3R5bGUucmFkaXVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmFkaXVzID0gc3R5bGUucmFkaXVzKGN0eC56b29tKTsgLy9BbGxvd3MgZm9yIHNjYWxlIGRlcGVuZGVudCByZWRuZXJpbmdcbiAgfVxuICBlbHNle1xuICAgIHJhZGl1cyA9IHN0eWxlLnJhZGl1cztcbiAgfVxuXG4gIHZhciBwID0gdGhpcy5fdGlsZVBvaW50KGNvb3Jkc0FycmF5WzBdWzBdKTtcbiAgdmFyIGMgPSBjdHguY2FudmFzO1xuICB2YXIgY3R4MmQ7XG4gIHRyeXtcbiAgICBjdHgyZCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgfVxuICBjYXRjaChlKXtcbiAgICBjb25zb2xlLmxvZyhcIl9kcmF3UG9pbnQgZXJyb3I6IFwiICsgZSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY3R4MmQuYmVnaW5QYXRoKCk7XG4gIGN0eDJkLmZpbGxTdHlsZSA9IHN0eWxlLmNvbG9yO1xuICBjdHgyZC5hcmMocC54LCBwLnksIHJhZGl1cywgMCwgTWF0aC5QSSAqIDIpO1xuICBjdHgyZC5jbG9zZVBhdGgoKTtcbiAgY3R4MmQuZmlsbCgpO1xuXG4gIGlmKHN0eWxlLmxpbmVXaWR0aCAmJiBzdHlsZS5zdHJva2VTdHlsZSl7XG4gICAgY3R4MmQubGluZVdpZHRoID0gc3R5bGUubGluZVdpZHRoO1xuICAgIGN0eDJkLnN0cm9rZVN0eWxlID0gc3R5bGUuc3Ryb2tlU3R5bGU7XG4gICAgY3R4MmQuc3Ryb2tlKCk7XG4gIH1cblxuICBjdHgyZC5yZXN0b3JlKCk7XG4gIHRpbGUucGF0aHMucHVzaChbcF0pO1xufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuX2RyYXdMaW5lU3RyaW5nID0gZnVuY3Rpb24oY3R4LCBjb29yZHNBcnJheSwgc3R5bGUpIHtcbiAgaWYgKCFzdHlsZSkgcmV0dXJuO1xuICBpZiAoIWN0eCB8fCAhY3R4LmNhbnZhcykgcmV0dXJuO1xuXG4gIHZhciBjdHgyZCA9IGN0eC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY3R4MmQuc3Ryb2tlU3R5bGUgPSBzdHlsZS5jb2xvcjtcbiAgY3R4MmQubGluZVdpZHRoID0gc3R5bGUuc2l6ZTtcbiAgY3R4MmQuYmVnaW5QYXRoKCk7XG5cbiAgdmFyIHByb2pDb29yZHMgPSBbXTtcbiAgdmFyIHRpbGUgPSB0aGlzLnRpbGVzW2N0eC5pZF07XG5cbiAgZm9yICh2YXIgZ2lkeCBpbiBjb29yZHNBcnJheSkge1xuICAgIHZhciBjb29yZHMgPSBjb29yZHNBcnJheVtnaWR4XTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBjb29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBtZXRob2QgPSAoaSA9PT0gMCA/ICdtb3ZlJyA6ICdsaW5lJykgKyAnVG8nO1xuICAgICAgdmFyIHByb2ogPSB0aGlzLl90aWxlUG9pbnQoY29vcmRzW2ldKTtcbiAgICAgIHByb2pDb29yZHMucHVzaChwcm9qKTtcbiAgICAgIGN0eDJkW21ldGhvZF0ocHJvai54LCBwcm9qLnkpO1xuICAgIH1cbiAgfVxuXG4gIGN0eDJkLnN0cm9rZSgpO1xuICBjdHgyZC5yZXN0b3JlKCk7XG5cbiAgdGlsZS5wYXRocy5wdXNoKHByb2pDb29yZHMpO1xufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuX2RyYXdQb2x5Z29uID0gZnVuY3Rpb24oY3R4LCBjb29yZHNBcnJheSwgc3R5bGUpIHtcbiAgaWYgKCFzdHlsZSkgcmV0dXJuO1xuICBpZiAoIWN0eCB8fCAhY3R4LmNhbnZhcykgcmV0dXJuO1xuXG4gIHZhciBjdHgyZCA9IGN0eC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgdmFyIG91dGxpbmUgPSBzdHlsZS5vdXRsaW5lO1xuXG4gIC8vIGNvbG9yIG1heSBiZSBkZWZpbmVkIHZpYSBmdW5jdGlvbiB0byBtYWtlIGNob3JvcGxldGggd29yayByaWdodFxuICBpZiAodHlwZW9mIHN0eWxlLmNvbG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY3R4MmQuZmlsbFN0eWxlID0gc3R5bGUuY29sb3IoY3R4MmQpO1xuICB9IGVsc2Uge1xuICAgIGN0eDJkLmZpbGxTdHlsZSA9IHN0eWxlLmNvbG9yO1xuICB9XG5cbiAgaWYgKG91dGxpbmUpIHtcbiAgICBjdHgyZC5zdHJva2VTdHlsZSA9IG91dGxpbmUuY29sb3I7XG4gICAgY3R4MmQubGluZVdpZHRoID0gb3V0bGluZS5zaXplO1xuICB9XG4gIGN0eDJkLmJlZ2luUGF0aCgpO1xuXG4gIHZhciBwcm9qQ29vcmRzID0gW107XG4gIHZhciB0aWxlID0gdGhpcy50aWxlc1tjdHguaWRdO1xuXG4gIHZhciBmZWF0dXJlTGFiZWwgPSB0aGlzLmR5bmFtaWNMYWJlbDtcbiAgaWYgKGZlYXR1cmVMYWJlbCkge1xuICAgIGZlYXR1cmVMYWJlbC5hZGRUaWxlUG9seXMoY3R4LCBjb29yZHNBcnJheSk7XG4gIH1cblxuICBmb3IgKHZhciBnaWR4ID0gMCwgbGVuID0gY29vcmRzQXJyYXkubGVuZ3RoOyBnaWR4IDwgbGVuOyBnaWR4KyspIHtcbiAgICB2YXIgY29vcmRzID0gY29vcmRzQXJyYXlbZ2lkeF07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNvb3JkID0gY29vcmRzW2ldO1xuICAgICAgdmFyIG1ldGhvZCA9IChpID09PSAwID8gJ21vdmUnIDogJ2xpbmUnKSArICdUbyc7XG4gICAgICB2YXIgcHJvaiA9IHRoaXMuX3RpbGVQb2ludChjb29yZHNbaV0pO1xuICAgICAgcHJvakNvb3Jkcy5wdXNoKHByb2opO1xuICAgICAgY3R4MmRbbWV0aG9kXShwcm9qLngsIHByb2oueSk7XG4gICAgfVxuICB9XG5cbiAgY3R4MmQuY2xvc2VQYXRoKCk7XG4gIGN0eDJkLmZpbGwoKTtcbiAgaWYgKG91dGxpbmUpIHtcbiAgICBjdHgyZC5zdHJva2UoKTtcbiAgfVxuXG4gIHRpbGUucGF0aHMucHVzaChwcm9qQ29vcmRzKTtcblxufTtcblxuTVZURmVhdHVyZS5wcm90b3R5cGUuX2RyYXdTdGF0aWNMYWJlbCA9IGZ1bmN0aW9uKGN0eCwgY29vcmRzQXJyYXksIHN0eWxlKSB7XG4gIGlmICghc3R5bGUpIHJldHVybjtcbiAgaWYgKCFjdHgpIHJldHVybjtcblxuICAvLyBJZiB0aGUgY29ycmVzcG9uZGluZyBsYXllciBpcyBub3Qgb24gdGhlIG1hcCwgXG4gIC8vIHdlIGRvbnQgd2FudCB0byBwdXQgb24gYSBsYWJlbC5cbiAgaWYgKCF0aGlzLm12dExheWVyLl9tYXApIHJldHVybjtcblxuICB2YXIgdmVjUHQgPSB0aGlzLl90aWxlUG9pbnQoY29vcmRzQXJyYXlbMF1bMF0pO1xuXG4gIC8vIFdlJ3JlIG1ha2luZyBhIHN0YW5kYXJkIExlYWZsZXQgTWFya2VyIGZvciB0aGlzIGxhYmVsLlxuICB2YXIgcCA9IHRoaXMuX3Byb2plY3QodmVjUHQsIGN0eC50aWxlLngsIGN0eC50aWxlLnksIHRoaXMuZXh0ZW50LCB0aGlzLnRpbGVTaXplKTsgLy92ZWN0aWxlIHB0IHRvIG1lcmMgcHRcbiAgdmFyIG1lcmNQdCA9IEwucG9pbnQocC54LCBwLnkpOyAvLyBtYWtlIGludG8gbGVhZmxldCBvYmpcbiAgdmFyIGxhdExuZyA9IHRoaXMubWFwLnVucHJvamVjdChtZXJjUHQpOyAvLyBtZXJjIHB0IHRvIGxhdGxuZ1xuXG4gIHRoaXMuc3RhdGljTGFiZWwgPSBuZXcgU3RhdGljTGFiZWwodGhpcywgY3R4LCBsYXRMbmcsIHN0eWxlKTtcbiAgdGhpcy5tdnRMYXllci5mZWF0dXJlV2l0aExhYmVsQWRkZWQodGhpcyk7XG59O1xuXG5NVlRGZWF0dXJlLnByb3RvdHlwZS5yZW1vdmVMYWJlbCA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuc3RhdGljTGFiZWwpIHJldHVybjtcbiAgdGhpcy5zdGF0aWNMYWJlbC5yZW1vdmUoKTtcbiAgdGhpcy5zdGF0aWNMYWJlbCA9IG51bGw7XG59O1xuXG4vKipcbiAqIFByb2plY3RzIGEgdmVjdG9yIHRpbGUgcG9pbnQgdG8gdGhlIFNwaGVyaWNhbCBNZXJjYXRvciBwaXhlbCBzcGFjZSBmb3IgYSBnaXZlbiB6b29tIGxldmVsLlxuICpcbiAqIEBwYXJhbSB2ZWNQdFxuICogQHBhcmFtIHRpbGVYXG4gKiBAcGFyYW0gdGlsZVlcbiAqIEBwYXJhbSBleHRlbnRcbiAqIEBwYXJhbSB0aWxlU2l6ZVxuICovXG5NVlRGZWF0dXJlLnByb3RvdHlwZS5fcHJvamVjdCA9IGZ1bmN0aW9uKHZlY1B0LCB0aWxlWCwgdGlsZVksIGV4dGVudCwgdGlsZVNpemUpIHtcbiAgdmFyIHhPZmZzZXQgPSB0aWxlWCAqIHRpbGVTaXplO1xuICB2YXIgeU9mZnNldCA9IHRpbGVZICogdGlsZVNpemU7XG4gIHJldHVybiB7XG4gICAgeDogTWF0aC5mbG9vcih2ZWNQdC54ICsgeE9mZnNldCksXG4gICAgeTogTWF0aC5mbG9vcih2ZWNQdC55ICsgeU9mZnNldClcbiAgfTtcbn07XG5cbi8qKlxuICogVGFrZXMgYSBjb29yZGluYXRlIGZyb20gYSB2ZWN0b3IgdGlsZSBhbmQgdHVybnMgaXQgaW50byBhIExlYWZsZXQgUG9pbnQuXG4gKlxuICogQHBhcmFtIGN0eFxuICogQHBhcmFtIGNvb3Jkc1xuICogQHJldHVybnMge2VHZW9tVHlwZS5Qb2ludH1cbiAqIEBwcml2YXRlXG4gKi9cbk1WVEZlYXR1cmUucHJvdG90eXBlLl90aWxlUG9pbnQgPSBmdW5jdGlvbihjb29yZHMpIHtcbiAgcmV0dXJuIG5ldyBMLlBvaW50KGNvb3Jkcy54IC8gdGhpcy5kaXZpc29yLCBjb29yZHMueSAvIHRoaXMuZGl2aXNvcik7XG59O1xuXG5NVlRGZWF0dXJlLnByb3RvdHlwZS5saW5rZWRGZWF0dXJlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBsaW5rZWRMYXllciA9IHRoaXMubXZ0TGF5ZXIubGlua2VkTGF5ZXIoKTtcbiAgaWYobGlua2VkTGF5ZXIpe1xuICAgIHZhciBsaW5rZWRGZWF0dXJlID0gbGlua2VkTGF5ZXIuZmVhdHVyZXNbdGhpcy5pZF07XG4gICAgcmV0dXJuIGxpbmtlZEZlYXR1cmU7XG4gIH1lbHNle1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgUnlhbiBXaGl0bGV5IG9uIDUvMTcvMTQuXG4gKi9cbi8qKiBGb3JrZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9ER3VpZGkvMTcxNjAxMCAqKi9cbnZhciBNVlRGZWF0dXJlID0gcmVxdWlyZSgnLi9NVlRGZWF0dXJlJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vTVZUVXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEwuVGlsZUxheWVyLkNhbnZhcy5leHRlbmQoe1xuXG4gIG9wdGlvbnM6IHtcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgaXNIaWRkZW5MYXllcjogZmFsc2UsXG4gICAgZ2V0SURGb3JMYXllckZlYXR1cmU6IGZ1bmN0aW9uKCkge30sXG4gICAgdGlsZVNpemU6IDI1NixcbiAgICBsaW5lQ2xpY2tUb2xlcmFuY2U6IDJcbiAgfSxcblxuICBfZmVhdHVyZUlzQ2xpY2tlZDoge30sXG5cbiAgX2lzUG9pbnRJblBvbHk6IGZ1bmN0aW9uKHB0LCBwb2x5KSB7XG4gICAgaWYocG9seSAmJiBwb2x5Lmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgYyA9IGZhbHNlLCBpID0gLTEsIGwgPSBwb2x5Lmxlbmd0aCwgaiA9IGwgLSAxOyArK2kgPCBsOyBqID0gaSlcbiAgICAgICAgKChwb2x5W2ldLnkgPD0gcHQueSAmJiBwdC55IDwgcG9seVtqXS55KSB8fCAocG9seVtqXS55IDw9IHB0LnkgJiYgcHQueSA8IHBvbHlbaV0ueSkpXG4gICAgICAgICYmIChwdC54IDwgKHBvbHlbal0ueCAtIHBvbHlbaV0ueCkgKiAocHQueSAtIHBvbHlbaV0ueSkgLyAocG9seVtqXS55IC0gcG9seVtpXS55KSArIHBvbHlbaV0ueClcbiAgICAgICAgJiYgKGMgPSAhYyk7XG4gICAgICByZXR1cm4gYztcbiAgICB9XG4gIH0sXG5cbiAgX2dldERpc3RhbmNlRnJvbUxpbmU6IGZ1bmN0aW9uKHB0LCBwdHMpIHtcbiAgICB2YXIgbWluID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGlmIChwdHMgJiYgcHRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHB0ID0gTC5wb2ludChwdC54LCBwdC55KTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcHRzLmxlbmd0aCAtIDE7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl9wcm9qZWN0UG9pbnRPbkxpbmVTZWdtZW50KHB0LCBwdHNbaV0sIHB0c1tpICsgMV0pO1xuICAgICAgICBpZiAodGVzdC5kaXN0YW5jZSA8PSBtaW4pIHtcbiAgICAgICAgICBtaW4gPSB0ZXN0LmRpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtaW47XG4gIH0sXG5cbiAgX3Byb2plY3RQb2ludE9uTGluZVNlZ21lbnQ6IGZ1bmN0aW9uKHAsIHIwLCByMSkge1xuICAgIHZhciBsaW5lTGVuZ3RoID0gcjAuZGlzdGFuY2VUbyhyMSk7XG4gICAgaWYgKGxpbmVMZW5ndGggPCAxKSB7XG4gICAgICAgIHJldHVybiB7ZGlzdGFuY2U6IHAuZGlzdGFuY2VUbyhyMCksIGNvb3JkaW5hdGU6IHIwfTtcbiAgICB9XG4gICAgdmFyIHUgPSAoKHAueCAtIHIwLngpICogKHIxLnggLSByMC54KSArIChwLnkgLSByMC55KSAqIChyMS55IC0gcjAueSkpIC8gTWF0aC5wb3cobGluZUxlbmd0aCwgMik7XG4gICAgaWYgKHUgPCAwLjAwMDAwMDEpIHtcbiAgICAgICAgcmV0dXJuIHtkaXN0YW5jZTogcC5kaXN0YW5jZVRvKHIwKSwgY29vcmRpbmF0ZTogcjB9O1xuICAgIH1cbiAgICBpZiAodSA+IDAuOTk5OTk5OSkge1xuICAgICAgICByZXR1cm4ge2Rpc3RhbmNlOiBwLmRpc3RhbmNlVG8ocjEpLCBjb29yZGluYXRlOiByMX07XG4gICAgfVxuICAgIHZhciBhID0gTC5wb2ludChyMC54ICsgdSAqIChyMS54IC0gcjAueCksIHIwLnkgKyB1ICogKHIxLnkgLSByMC55KSk7XG4gICAgcmV0dXJuIHtkaXN0YW5jZTogcC5kaXN0YW5jZVRvKGEpLCBwb2ludDogYX07XG4gIH0sXG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24obXZ0U291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYubXZ0U291cmNlID0gbXZ0U291cmNlO1xuICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5zdHlsZSA9IG9wdGlvbnMuc3R5bGU7XG4gICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgIHRoaXMuX2NhbnZhc0lEVG9GZWF0dXJlcyA9IHt9O1xuICAgIHRoaXMuZmVhdHVyZXMgPSB7fTtcbiAgICB0aGlzLmZlYXR1cmVzV2l0aExhYmVscyA9IFtdO1xuICAgIHRoaXMuX2hpZ2hlc3RDb3VudCA9IDA7XG4gIH0sXG5cbiAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLm1hcCA9IG1hcDtcbiAgICBMLlRpbGVMYXllci5DYW52YXMucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICBtYXAub24oJ2xheWVycmVtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgICAgLy8gd2Ugb25seSB3YW50IHRvIGRvIHN0dWZmIHdoZW4gdGhlIGxheWVycmVtb3ZlIGV2ZW50IGlzIG9uIHRoaXMgbGF5ZXJcbiAgICAgIGlmIChlLmxheWVyLl9sZWFmbGV0X2lkID09PSBzZWxmLl9sZWFmbGV0X2lkKSB7XG4gICAgICAgIHJlbW92ZUxhYmVscyhzZWxmKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBkcmF3VGlsZTogZnVuY3Rpb24oY2FudmFzLCB0aWxlUG9pbnQsIHpvb20pIHtcblxuICAgIHZhciBjdHggPSB7XG4gICAgICBjYW52YXM6IGNhbnZhcyxcbiAgICAgIHRpbGU6IHRpbGVQb2ludCxcbiAgICAgIHpvb206IHpvb20sXG4gICAgICB0aWxlU2l6ZTogdGhpcy5vcHRpb25zLnRpbGVTaXplXG4gICAgfTtcblxuICAgIGN0eC5pZCA9IFV0aWwuZ2V0Q29udGV4dElEKGN0eCk7XG5cbiAgICBpZiAoIXRoaXMuX2NhbnZhc0lEVG9GZWF0dXJlc1tjdHguaWRdKSB7XG4gICAgICB0aGlzLl9pbml0aWFsaXplRmVhdHVyZXNIYXNoKGN0eCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5mZWF0dXJlcykge1xuICAgICAgdGhpcy5mZWF0dXJlcyA9IHt9O1xuICAgIH1cblxuICB9LFxuXG4gIF9pbml0aWFsaXplRmVhdHVyZXNIYXNoOiBmdW5jdGlvbihjdHgpe1xuICAgIHRoaXMuX2NhbnZhc0lEVG9GZWF0dXJlc1tjdHguaWRdID0ge307XG4gICAgdGhpcy5fY2FudmFzSURUb0ZlYXR1cmVzW2N0eC5pZF0uZmVhdHVyZXMgPSBbXTtcbiAgICB0aGlzLl9jYW52YXNJRFRvRmVhdHVyZXNbY3R4LmlkXS5jYW52YXMgPSBjdHguY2FudmFzO1xuICB9LFxuXG4gIF9kcmF3OiBmdW5jdGlvbihjdHgpIHtcbiAgICAvL0RyYXcgaXMgaGFuZGxlZCBieSB0aGUgcGFyZW50IE1WVFNvdXJjZSBvYmplY3RcbiAgfSxcbiAgZ2V0Q2FudmFzOiBmdW5jdGlvbihwYXJlbnRDdHgpe1xuICAgIC8vVGhpcyBnZXRzIGNhbGxlZCBpZiBhIHZlY3RvciB0aWxlIGZlYXR1cmUgaGFzIGFscmVhZHkgYmVlbiBwYXJzZWQuXG4gICAgLy9XZSd2ZSBhbHJlYWR5IGdvdCB0aGUgZ2VvbSwganVzdCBnZXQgb24gd2l0aCB0aGUgZHJhd2luZy5cbiAgICAvL05lZWQgYSB3YXkgdG8gcGx1Y2sgYSBjYW52YXMgZWxlbWVudCBmcm9tIHRoaXMgbGF5ZXIgZ2l2ZW4gdGhlIHBhcmVudCBsYXllcidzIGlkLlxuICAgIC8vV2FpdCBmb3IgaXQgdG8gZ2V0IGxvYWRlZCBiZWZvcmUgcHJvY2VlZGluZy5cbiAgICB2YXIgdGlsZVBvaW50ID0gcGFyZW50Q3R4LnRpbGU7XG4gICAgdmFyIGN0eCA9IHRoaXMuX3RpbGVzW3RpbGVQb2ludC54ICsgXCI6XCIgKyB0aWxlUG9pbnQueV07XG5cbiAgICBpZihjdHgpe1xuICAgICAgcGFyZW50Q3R4LmNhbnZhcyA9IGN0eDtcbiAgICAgIHRoaXMucmVkcmF3VGlsZShwYXJlbnRDdHguaWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vVGhpcyBpcyBhIHRpbWVyIHRoYXQgd2lsbCB3YWl0IGZvciBhIGNyaXRlcmlvbiB0byByZXR1cm4gdHJ1ZS5cbiAgICAvL0lmIG5vdCB0cnVlIHdpdGhpbiB0aGUgdGltZW91dCBkdXJhdGlvbiwgaXQgd2lsbCBtb3ZlIG9uLlxuICAgIHdhaXRGb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICBjdHggPSBzZWxmLl90aWxlc1t0aWxlUG9pbnQueCArIFwiOlwiICsgdGlsZVBvaW50LnldO1xuICAgICAgICBpZihjdHgpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vV2hlbiBpdCBmaW5pc2hlcywgZG8gdGhpcy5cbiAgICAgICAgY3R4ID0gc2VsZi5fdGlsZXNbdGlsZVBvaW50LnggKyBcIjpcIiArIHRpbGVQb2ludC55XTtcbiAgICAgICAgcGFyZW50Q3R4LmNhbnZhcyA9IGN0eDtcbiAgICAgICAgc2VsZi5yZWRyYXdUaWxlKHBhcmVudEN0eC5pZCk7XG5cbiAgICAgIH0sIC8vd2hlbiBkb25lLCBnbyB0byBuZXh0IGZsb3dcbiAgICAgIDIwMDApOyAvL1RoZSBUaW1lb3V0IG1pbGxpc2Vjb25kcy4gIEFmdGVyIHRoaXMsIGdpdmUgdXAgYW5kIG1vdmUgb25cblxuICB9LFxuXG4gIHBhcnNlVmVjdG9yVGlsZUxheWVyOiBmdW5jdGlvbih2dGwsIGN0eCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdGlsZVBvaW50ID0gY3R4LnRpbGU7XG4gICAgdmFyIGxheWVyQ3R4ICA9IHsgY2FudmFzOiBudWxsLCBpZDogY3R4LmlkLCB0aWxlOiBjdHgudGlsZSwgem9vbTogY3R4Lnpvb20sIHRpbGVTaXplOiBjdHgudGlsZVNpemV9O1xuXG4gICAgLy9TZWUgaWYgd2UgY2FuIHBsdWNrIHRoZSBjaGlsZCB0aWxlIGZyb20gdGhpcyBQQkYgdGlsZSBsYXllciBiYXNlZCBvbiB0aGUgbWFzdGVyIGxheWVyJ3MgdGlsZSBpZC5cbiAgICBsYXllckN0eC5jYW52YXMgPSBzZWxmLl90aWxlc1t0aWxlUG9pbnQueCArIFwiOlwiICsgdGlsZVBvaW50LnldO1xuXG5cblxuICAgIC8vSW5pdGlhbGl6ZSB0aGlzIHRpbGUncyBmZWF0dXJlIHN0b3JhZ2UgaGFzaCwgaWYgaXQgaGFzbid0IGFscmVhZHkgYmVlbiBjcmVhdGVkLiAgVXNlZCBmb3Igd2hlbiBmaWx0ZXJzIGFyZSB1cGRhdGVkLCBhbmQgZmVhdHVyZXMgYXJlIGNsZWFyZWQgdG8gcHJlcGFyZSBmb3IgYSBmcmVzaCByZWRyYXcuXG4gICAgaWYgKCF0aGlzLl9jYW52YXNJRFRvRmVhdHVyZXNbbGF5ZXJDdHguaWRdKSB7XG4gICAgICB0aGlzLl9pbml0aWFsaXplRmVhdHVyZXNIYXNoKGxheWVyQ3R4KTtcbiAgICB9ZWxzZXtcbiAgICAgIC8vQ2xlYXIgdGhpcyB0aWxlJ3MgcHJldmlvdXNseSBzYXZlZCBmZWF0dXJlcy5cbiAgICAgIHRoaXMuY2xlYXJUaWxlRmVhdHVyZUhhc2gobGF5ZXJDdHguaWQpO1xuICAgIH1cblxuICAgIHZhciBmZWF0dXJlcyA9IHZ0bC5wYXJzZWRGZWF0dXJlcztcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZmVhdHVyZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciB2dGYgPSBmZWF0dXJlc1tpXTsgLy92ZWN0b3IgdGlsZSBmZWF0dXJlXG4gICAgICB2dGYubGF5ZXIgPSB2dGw7XG5cbiAgICAgIC8qKlxuICAgICAgICogQXBwbHkgZmlsdGVyIG9uIGZlYXR1cmUgaWYgdGhlcmUgaXMgb25lLiBEZWZpbmVkIGluIHRoZSBvcHRpb25zIG9iamVjdFxuICAgICAgICogb2YgVGlsZUxheWVyLk1WVFNvdXJjZS5qc1xuICAgICAgICovXG4gICAgICB2YXIgZmlsdGVyID0gc2VsZi5vcHRpb25zLmZpbHRlcjtcbiAgICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmICggZmlsdGVyKHZ0ZiwgbGF5ZXJDdHgpID09PSBmYWxzZSApIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgZ2V0SURGb3JMYXllckZlYXR1cmU7XG4gICAgICBpZiAodHlwZW9mIHNlbGYub3B0aW9ucy5nZXRJREZvckxheWVyRmVhdHVyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBnZXRJREZvckxheWVyRmVhdHVyZSA9IHNlbGYub3B0aW9ucy5nZXRJREZvckxheWVyRmVhdHVyZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdldElERm9yTGF5ZXJGZWF0dXJlID0gVXRpbC5nZXRJREZvckxheWVyRmVhdHVyZTtcbiAgICAgIH1cbiAgICAgIHZhciB1bmlxdWVJRCA9IHNlbGYub3B0aW9ucy5nZXRJREZvckxheWVyRmVhdHVyZSh2dGYpIHx8IGk7XG4gICAgICB2YXIgbXZ0RmVhdHVyZSA9IHNlbGYuZmVhdHVyZXNbdW5pcXVlSURdO1xuXG4gICAgICAvKipcbiAgICAgICAqIFVzZSBsYXllck9yZGVyaW5nIGZ1bmN0aW9uIHRvIGFwcGx5IGEgekluZGV4IHByb3BlcnR5IHRvIGVhY2ggdnRmLiAgVGhpcyBpcyBkZWZpbmVkIGluXG4gICAgICAgKiBUaWxlTGF5ZXIuTVZUU291cmNlLmpzLiAgVXNlZCBiZWxvdyB0byBzb3J0IGZlYXR1cmVzLm5wbVxuICAgICAgICovXG4gICAgICB2YXIgbGF5ZXJPcmRlcmluZyA9IHNlbGYub3B0aW9ucy5sYXllck9yZGVyaW5nO1xuICAgICAgaWYgKHR5cGVvZiBsYXllck9yZGVyaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxheWVyT3JkZXJpbmcodnRmLCBsYXllckN0eCk7IC8vQXBwbGllcyBhIGN1c3RvbSBwcm9wZXJ0eSB0byB0aGUgZmVhdHVyZSwgd2hpY2ggaXMgdXNlZCBhZnRlciB3ZSdyZSB0aHJ1IGl0ZXJhdGluZyB0byBzb3J0XG4gICAgICB9XG5cbiAgICAgIC8vQ3JlYXRlIGEgbmV3IE1WVEZlYXR1cmUgaWYgb25lIGRvZXNuJ3QgYWxyZWFkeSBleGlzdCBmb3IgdGhpcyBmZWF0dXJlLlxuICAgICAgaWYgKCFtdnRGZWF0dXJlKSB7XG4gICAgICAgIC8vR2V0IGEgc3R5bGUgZm9yIHRoZSBmZWF0dXJlIC0gc2V0IGl0IGp1c3Qgb25jZSBmb3IgZWFjaCBuZXcgTVZURmVhdHVyZVxuICAgICAgICB2YXIgc3R5bGUgPSBzZWxmLnN0eWxlKHZ0Zik7XG5cbiAgICAgICAgLy9jcmVhdGUgYSBuZXcgZmVhdHVyZVxuICAgICAgICBzZWxmLmZlYXR1cmVzW3VuaXF1ZUlEXSA9IG12dEZlYXR1cmUgPSBuZXcgTVZURmVhdHVyZShzZWxmLCB2dGYsIGxheWVyQ3R4LCB1bmlxdWVJRCwgc3R5bGUpO1xuICAgICAgICBpZiAoc3R5bGUgJiYgc3R5bGUuZHluYW1pY0xhYmVsICYmIHR5cGVvZiBzdHlsZS5keW5hbWljTGFiZWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBzZWxmLmZlYXR1cmVzV2l0aExhYmVscy5wdXNoKG12dEZlYXR1cmUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL0FkZCB0aGUgbmV3IHBhcnQgdG8gdGhlIGV4aXN0aW5nIGZlYXR1cmVcbiAgICAgICAgbXZ0RmVhdHVyZS5hZGRUaWxlRmVhdHVyZSh2dGYsIGxheWVyQ3R4KTtcbiAgICAgIH1cblxuICAgICAgLy9Bc3NvY2lhdGUgJiBTYXZlIHRoaXMgZmVhdHVyZSB3aXRoIHRoaXMgdGlsZSBmb3IgbGF0ZXJcbiAgICAgIGlmKGxheWVyQ3R4ICYmIGxheWVyQ3R4LmlkKSBzZWxmLl9jYW52YXNJRFRvRmVhdHVyZXNbbGF5ZXJDdHguaWRdWydmZWF0dXJlcyddLnB1c2gobXZ0RmVhdHVyZSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBseSBzb3J0aW5nICh6SW5kZXgpIG9uIGZlYXR1cmUgaWYgdGhlcmUgaXMgYSBmdW5jdGlvbiBkZWZpbmVkIGluIHRoZSBvcHRpb25zIG9iamVjdFxuICAgICAqIG9mIFRpbGVMYXllci5NVlRTb3VyY2UuanNcbiAgICAgKi9cbiAgICB2YXIgbGF5ZXJPcmRlcmluZyA9IHNlbGYub3B0aW9ucy5sYXllck9yZGVyaW5nO1xuICAgIGlmIChsYXllck9yZGVyaW5nKSB7XG4gICAgICAvL1dlJ3ZlIGFzc2lnbmVkIHRoZSBjdXN0b20gekluZGV4IHByb3BlcnR5IHdoZW4gaXRlcmF0aW5nIGFib3ZlLiAgTm93IGp1c3Qgc29ydC5cbiAgICAgIHNlbGYuX2NhbnZhc0lEVG9GZWF0dXJlc1tsYXllckN0eC5pZF0uZmVhdHVyZXMgPSBzZWxmLl9jYW52YXNJRFRvRmVhdHVyZXNbbGF5ZXJDdHguaWRdLmZlYXR1cmVzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gLShiLnByb3BlcnRpZXMuekluZGV4IC0gYS5wcm9wZXJ0aWVzLnpJbmRleClcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYucmVkcmF3VGlsZShsYXllckN0eC5pZCk7XG4gIH0sXG5cbiAgc2V0U3R5bGU6IGZ1bmN0aW9uKHN0eWxlRm4pIHtcbiAgICAvLyByZWZyZXNoIHRoZSBudW1iZXIgZm9yIHRoZSBoaWdoZXN0IGNvdW50IHZhbHVlXG4gICAgLy8gdGhpcyBpcyB1c2VkIG9ubHkgZm9yIGNob3JvcGxldGhcbiAgICB0aGlzLl9oaWdoZXN0Q291bnQgPSAwO1xuXG4gICAgLy8gbG93ZXN0IGNvdW50IHNob3VsZCBub3QgYmUgMCwgc2luY2Ugd2Ugd2FudCB0byBmaWd1cmUgb3V0IHRoZSBsb3dlc3RcbiAgICB0aGlzLl9sb3dlc3RDb3VudCA9IG51bGw7XG5cbiAgICB0aGlzLnN0eWxlID0gc3R5bGVGbjtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5mZWF0dXJlcykge1xuICAgICAgdmFyIGZlYXQgPSB0aGlzLmZlYXR1cmVzW2tleV07XG4gICAgICBmZWF0LnNldFN0eWxlKHN0eWxlRm4pO1xuICAgIH1cbiAgICB2YXIgeiA9IHRoaXMubWFwLmdldFpvb20oKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fdGlsZXMpIHtcbiAgICAgIHZhciBpZCA9IHogKyAnOicgKyBrZXk7XG4gICAgICB0aGlzLnJlZHJhd1RpbGUoaWQpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQXMgY291bnRzIGZvciBjaG9yb3BsZXRocyBjb21lIGluIHdpdGggdGhlIGFqYXggZGF0YSxcbiAgICogd2Ugd2FudCB0byBrZWVwIHRyYWNrIG9mIHdoaWNoIHZhbHVlIGlzIHRoZSBoaWdoZXN0XG4gICAqIHRvIGNyZWF0ZSB0aGUgY29sb3IgcmFtcCBmb3IgdGhlIGZpbGxzIG9mIHBvbHlnb25zLlxuICAgKiBAcGFyYW0gY291bnRcbiAgICovXG4gIHNldEhpZ2hlc3RDb3VudDogZnVuY3Rpb24oY291bnQpIHtcbiAgICBpZiAoY291bnQgPiB0aGlzLl9oaWdoZXN0Q291bnQpIHtcbiAgICAgIHRoaXMuX2hpZ2hlc3RDb3VudCA9IGNvdW50O1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaGlnaGVzdCBudW1iZXIgb2YgYWxsIG9mIHRoZSBjb3VudHMgdGhhdCBoYXZlIGNvbWUgaW5cbiAgICogZnJvbSBzZXRIaWdoZXN0Q291bnQuIFRoaXMgaXMgYXNzdW1lZCB0byBiZSBzZXQgdmlhIGFqYXggY2FsbGJhY2tzLlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgKi9cbiAgZ2V0SGlnaGVzdENvdW50OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5faGlnaGVzdENvdW50O1xuICB9LFxuXG4gIHNldExvd2VzdENvdW50OiBmdW5jdGlvbihjb3VudCkge1xuICAgIGlmICghdGhpcy5fbG93ZXN0Q291bnQgfHwgY291bnQgPCB0aGlzLl9sb3dlc3RDb3VudCkge1xuICAgICAgdGhpcy5fbG93ZXN0Q291bnQgPSBjb3VudDtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0TG93ZXN0Q291bnQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9sb3dlc3RDb3VudDtcbiAgfSxcblxuICBzZXRDb3VudFJhbmdlOiBmdW5jdGlvbihjb3VudCkge1xuICAgIHRoaXMuc2V0SGlnaGVzdENvdW50KGNvdW50KTtcbiAgICB0aGlzLnNldExvd2VzdENvdW50KGNvdW50KTtcbiAgfSxcblxuICAvL1RoaXMgaXMgdGhlIG9sZCB3YXkuICBJdCB3b3JrcywgYnV0IGlzIHNsb3cgZm9yIG1vdXNlb3ZlciBldmVudHMuICBGaW5lIGZvciBjbGljayBldmVudHMuXG4gIGhhbmRsZUNsaWNrRXZlbnQ6IGZ1bmN0aW9uKGV2dCwgY2IpIHtcbiAgICAvL0NsaWNrIGhhcHBlbmVkIG9uIHRoZSBHcm91cExheWVyIChNYW5hZ2VyKSBhbmQgcGFzc2VkIGl0IGhlcmVcbiAgICB2YXIgdGlsZUlEID0gZXZ0LnRpbGVJRC5zcGxpdChcIjpcIikuc2xpY2UoMSwgMykuam9pbihcIjpcIik7XG4gICAgdmFyIHpvb20gPSBldnQudGlsZUlELnNwbGl0KFwiOlwiKVswXTtcbiAgICB2YXIgY2FudmFzID0gdGhpcy5fdGlsZXNbdGlsZUlEXTtcbiAgICBpZighY2FudmFzKSAoY2IoZXZ0KSk7IC8vYnJlYWsgb3V0XG4gICAgdmFyIHggPSBldnQubGF5ZXJQb2ludC54IC0gY2FudmFzLl9sZWFmbGV0X3Bvcy54O1xuICAgIHZhciB5ID0gZXZ0LmxheWVyUG9pbnQueSAtIGNhbnZhcy5fbGVhZmxldF9wb3MueTtcblxuICAgIHZhciB0aWxlUG9pbnQgPSB7eDogeCwgeTogeX07XG4gICAgdmFyIGZlYXR1cmVzID0gdGhpcy5fY2FudmFzSURUb0ZlYXR1cmVzW2V2dC50aWxlSURdLmZlYXR1cmVzO1xuXG4gICAgdmFyIG1pbkRpc3RhbmNlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIHZhciBuZWFyZXN0ID0gbnVsbDtcbiAgICB2YXIgaiwgcGF0aHMsIGRpc3RhbmNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmZWF0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGZlYXR1cmUgPSBmZWF0dXJlc1tpXTtcbiAgICAgIHN3aXRjaCAoZmVhdHVyZS50eXBlKSB7XG5cbiAgICAgICAgY2FzZSAxOiAvL1BvaW50IC0gY3VycmVudGx5IHJlbmRlcmVkIGFzIGNpcmN1bGFyIHBhdGhzLiAgSW50ZXJzZWN0IHdpdGggdGhhdC5cblxuICAgICAgICAgIC8vRmluZCB0aGUgcmFkaXVzIG9mIHRoZSBwb2ludC5cbiAgICAgICAgICB2YXIgcmFkaXVzID0gMztcbiAgICAgICAgICBpZiAodHlwZW9mIGZlYXR1cmUuc3R5bGUucmFkaXVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByYWRpdXMgPSBmZWF0dXJlLnN0eWxlLnJhZGl1cyh6b29tKTsgLy9BbGxvd3MgZm9yIHNjYWxlIGRlcGVuZGVudCByZWRuZXJpbmdcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIHJhZGl1cyA9IGZlYXR1cmUuc3R5bGUucmFkaXVzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGhzID0gZmVhdHVyZS5nZXRQYXRoc0ZvclRpbGUoZXZ0LnRpbGVJRCk7XG4gICAgICAgICAgZm9yIChqID0gMDsgaiA8IHBhdGhzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAvL0J1aWxkcyBhIGNpcmNsZSBvZiByYWRpdXMgZmVhdHVyZS5zdHlsZS5yYWRpdXMgKGFzc3VtaW5nIGNpcmN1bGFyIHBvaW50IHN5bWJvbG9neSkuXG4gICAgICAgICAgICBpZihpbl9jaXJjbGUocGF0aHNbal1bMF0ueCwgcGF0aHNbal1bMF0ueSwgcmFkaXVzLCB4LCB5KSl7XG4gICAgICAgICAgICAgIG5lYXJlc3QgPSBmZWF0dXJlO1xuICAgICAgICAgICAgICBtaW5EaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgMjogLy9MaW5lU3RyaW5nXG4gICAgICAgICAgcGF0aHMgPSBmZWF0dXJlLmdldFBhdGhzRm9yVGlsZShldnQudGlsZUlEKTtcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgcGF0aHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlLnN0eWxlKSB7XG4gICAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMuX2dldERpc3RhbmNlRnJvbUxpbmUodGlsZVBvaW50LCBwYXRoc1tqXSk7XG4gICAgICAgICAgICAgIHZhciB0aGlja25lc3MgPSAoZmVhdHVyZS5zZWxlY3RlZCAmJiBmZWF0dXJlLnN0eWxlLnNlbGVjdGVkID8gZmVhdHVyZS5zdHlsZS5zZWxlY3RlZC5zaXplIDogZmVhdHVyZS5zdHlsZS5zaXplKTtcbiAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlIDwgdGhpY2tuZXNzIC8gMiArIHRoaXMub3B0aW9ucy5saW5lQ2xpY2tUb2xlcmFuY2UgJiYgZGlzdGFuY2UgPCBtaW5EaXN0YW5jZSkge1xuICAgICAgICAgICAgICAgIG5lYXJlc3QgPSBmZWF0dXJlO1xuICAgICAgICAgICAgICAgIG1pbkRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAzOiAvL1BvbHlnb25cbiAgICAgICAgICBwYXRocyA9IGZlYXR1cmUuZ2V0UGF0aHNGb3JUaWxlKGV2dC50aWxlSUQpO1xuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBwYXRocy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzUG9pbnRJblBvbHkodGlsZVBvaW50LCBwYXRoc1tqXSkpIHtcbiAgICAgICAgICAgICAgbmVhcmVzdCA9IGZlYXR1cmU7XG4gICAgICAgICAgICAgIG1pbkRpc3RhbmNlID0gMDsgLy8gcG9pbnQgaXMgaW5zaWRlIHRoZSBwb2x5Z29uLCBzbyBkaXN0YW5jZSBpcyB6ZXJvXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKG1pbkRpc3RhbmNlID09IDApIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChuZWFyZXN0ICYmIG5lYXJlc3QudG9nZ2xlRW5hYmxlZCkge1xuICAgICAgICBuZWFyZXN0LnRvZ2dsZSgpO1xuICAgIH1cbiAgICBldnQuZmVhdHVyZSA9IG5lYXJlc3Q7XG4gICAgY2IoZXZ0KTtcbiAgfSxcblxuICBjbGVhclRpbGU6IGZ1bmN0aW9uKGlkKSB7XG4gICAgLy9pZCBpcyB0aGUgZW50aXJlIHpvb206eDp5LiAgd2UganVzdCB3YW50IHg6eS5cbiAgICB2YXIgY2EgPSBpZC5zcGxpdChcIjpcIik7XG4gICAgdmFyIGNhbnZhc0lkID0gY2FbMV0gKyBcIjpcIiArIGNhWzJdO1xuICAgIGlmICh0eXBlb2YgdGhpcy5fdGlsZXNbY2FudmFzSWRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc29sZS5lcnJvcihcInR5cGVvZiB0aGlzLl90aWxlc1tjYW52YXNJZF0gPT09ICd1bmRlZmluZWQnXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY2FudmFzID0gdGhpcy5fdGlsZXNbY2FudmFzSWRdO1xuXG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICB9LFxuXG4gIGNsZWFyVGlsZUZlYXR1cmVIYXNoOiBmdW5jdGlvbihjYW52YXNJRCl7XG4gICAgdGhpcy5fY2FudmFzSURUb0ZlYXR1cmVzW2NhbnZhc0lEXSA9IHsgZmVhdHVyZXM6IFtdfTsgLy9HZXQgcmlkIG9mIGFsbCBzYXZlZCBmZWF0dXJlc1xuICB9LFxuXG4gIGNsZWFyTGF5ZXJGZWF0dXJlSGFzaDogZnVuY3Rpb24oKXtcbiAgICB0aGlzLmZlYXR1cmVzID0ge307XG4gIH0sXG5cbiAgcmVkcmF3VGlsZTogZnVuY3Rpb24oY2FudmFzSUQpIHtcbiAgICAvL0ZpcnN0LCBjbGVhciB0aGUgY2FudmFzXG4gICAgdGhpcy5jbGVhclRpbGUoY2FudmFzSUQpO1xuXG4gICAgLy8gSWYgdGhlIGZlYXR1cmVzIGFyZSBub3QgaW4gdGhlIHRpbGUsIHRoZW4gdGhlcmUgaXMgbm90aGluZyB0byByZWRyYXcuXG4gICAgLy8gVGhpcyBtYXkgaGFwcGVuIGlmIHlvdSBjYWxsIHJlZHJhdyBiZWZvcmUgZmVhdHVyZXMgaGF2ZSBsb2FkZWQgYW5kIGluaXRpYWxseVxuICAgIC8vIGRyYXduIHRoZSB0aWxlLlxuICAgIHZhciBmZWF0ZmVhdHMgPSB0aGlzLl9jYW52YXNJRFRvRmVhdHVyZXNbY2FudmFzSURdO1xuICAgIGlmICghZmVhdGZlYXRzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy9HZXQgdGhlIGZlYXR1cmVzIGZvciB0aGlzIHRpbGUsIGFuZCByZWRyYXcgdGhlbS5cbiAgICB2YXIgZmVhdHVyZXMgPSBmZWF0ZmVhdHMuZmVhdHVyZXM7XG5cbiAgICAvLyB3ZSB3YW50IHRvIHNraXAgZHJhd2luZyB0aGUgc2VsZWN0ZWQgZmVhdHVyZXMgYW5kIGRyYXcgdGhlbSBsYXN0XG4gICAgdmFyIHNlbGVjdGVkRmVhdHVyZXMgPSBbXTtcblxuICAgIC8vIGRyYXdpbmcgYWxsIG9mIHRoZSBub24tc2VsZWN0ZWQgZmVhdHVyZXNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZlYXR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZmVhdHVyZSA9IGZlYXR1cmVzW2ldO1xuICAgICAgaWYgKGZlYXR1cmUuc2VsZWN0ZWQpIHtcbiAgICAgICAgc2VsZWN0ZWRGZWF0dXJlcy5wdXNoKGZlYXR1cmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmVhdHVyZS5kcmF3KGNhbnZhc0lEKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkcmF3aW5nIHRoZSBzZWxlY3RlZCBmZWF0dXJlcyBsYXN0XG4gICAgZm9yICh2YXIgaiA9IDAsIGxlbjIgPSBzZWxlY3RlZEZlYXR1cmVzLmxlbmd0aDsgaiA8IGxlbjI7IGorKykge1xuICAgICAgdmFyIHNlbEZlYXQgPSBzZWxlY3RlZEZlYXR1cmVzW2pdO1xuICAgICAgc2VsRmVhdC5kcmF3KGNhbnZhc0lEKTtcbiAgICB9XG4gIH0sXG5cbiAgX3Jlc2V0Q2FudmFzSURUb0ZlYXR1cmVzOiBmdW5jdGlvbihjYW52YXNJRCwgY2FudmFzKSB7XG5cbiAgICB0aGlzLl9jYW52YXNJRFRvRmVhdHVyZXNbY2FudmFzSURdID0ge307XG4gICAgdGhpcy5fY2FudmFzSURUb0ZlYXR1cmVzW2NhbnZhc0lEXS5mZWF0dXJlcyA9IFtdO1xuICAgIHRoaXMuX2NhbnZhc0lEVG9GZWF0dXJlc1tjYW52YXNJRF0uY2FudmFzID0gY2FudmFzO1xuXG4gIH0sXG5cbiAgbGlua2VkTGF5ZXI6IGZ1bmN0aW9uKCkge1xuICAgIGlmKHRoaXMubXZ0U291cmNlLmxheWVyTGluaykge1xuICAgICAgdmFyIGxpbmtOYW1lID0gdGhpcy5tdnRTb3VyY2UubGF5ZXJMaW5rKHRoaXMubmFtZSk7XG4gICAgICByZXR1cm4gdGhpcy5tdnRTb3VyY2UubGF5ZXJzW2xpbmtOYW1lXTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcblxuICBmZWF0dXJlV2l0aExhYmVsQWRkZWQ6IGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICB0aGlzLmZlYXR1cmVzV2l0aExhYmVscy5wdXNoKGZlYXR1cmUpO1xuICB9XG5cbn0pO1xuXG5cbmZ1bmN0aW9uIHJlbW92ZUxhYmVscyhzZWxmKSB7XG4gIHZhciBmZWF0dXJlcyA9IHNlbGYuZmVhdHVyZXNXaXRoTGFiZWxzO1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZmVhdHVyZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB2YXIgZmVhdCA9IGZlYXR1cmVzW2ldO1xuICAgIGZlYXQucmVtb3ZlTGFiZWwoKTtcbiAgfVxuICBzZWxmLmZlYXR1cmVzV2l0aExhYmVscyA9IFtdO1xufVxuXG5mdW5jdGlvbiBpbl9jaXJjbGUoY2VudGVyX3gsIGNlbnRlcl95LCByYWRpdXMsIHgsIHkpIHtcbiAgdmFyIHNxdWFyZV9kaXN0ID0gTWF0aC5wb3coKGNlbnRlcl94IC0geCksIDIpICsgTWF0aC5wb3coKGNlbnRlcl95IC0geSksIDIpO1xuICByZXR1cm4gc3F1YXJlX2Rpc3QgPD0gTWF0aC5wb3cocmFkaXVzLCAyKTtcbn1cbi8qKlxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hcml5YS9waGFudG9tanMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvd2FpdGZvci5qc1xuICpcbiAqIFdhaXQgdW50aWwgdGhlIHRlc3QgY29uZGl0aW9uIGlzIHRydWUgb3IgYSB0aW1lb3V0IG9jY3Vycy4gVXNlZnVsIGZvciB3YWl0aW5nXG4gKiBvbiBhIHNlcnZlciByZXNwb25zZSBvciBmb3IgYSB1aSBjaGFuZ2UgKGZhZGVJbiwgZXRjLikgdG8gb2NjdXIuXG4gKlxuICogQHBhcmFtIHRlc3RGeCBqYXZhc2NyaXB0IGNvbmRpdGlvbiB0aGF0IGV2YWx1YXRlcyB0byBhIGJvb2xlYW4sXG4gKiBpdCBjYW4gYmUgcGFzc2VkIGluIGFzIGEgc3RyaW5nIChlLmcuOiBcIjEgPT0gMVwiIG9yIFwiJCgnI2JhcicpLmlzKCc6dmlzaWJsZScpXCIgb3JcbiAqIGFzIGEgY2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0gb25SZWFkeSB3aGF0IHRvIGRvIHdoZW4gdGVzdEZ4IGNvbmRpdGlvbiBpcyBmdWxmaWxsZWQsXG4gKiBpdCBjYW4gYmUgcGFzc2VkIGluIGFzIGEgc3RyaW5nIChlLmcuOiBcIjEgPT0gMVwiIG9yIFwiJCgnI2JhcicpLmlzKCc6dmlzaWJsZScpXCIgb3JcbiAqIGFzIGEgY2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0gdGltZU91dE1pbGxpcyB0aGUgbWF4IGFtb3VudCBvZiB0aW1lIHRvIHdhaXQuIElmIG5vdCBzcGVjaWZpZWQsIDMgc2VjIGlzIHVzZWQuXG4gKi9cbmZ1bmN0aW9uIHdhaXRGb3IodGVzdEZ4LCBvblJlYWR5LCB0aW1lT3V0TWlsbGlzKSB7XG4gIHZhciBtYXh0aW1lT3V0TWlsbGlzID0gdGltZU91dE1pbGxpcyA/IHRpbWVPdXRNaWxsaXMgOiAzMDAwLCAvLzwgRGVmYXVsdCBNYXggVGltb3V0IGlzIDNzXG4gICAgc3RhcnQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcbiAgICBjb25kaXRpb24gPSAodHlwZW9mICh0ZXN0RngpID09PSBcInN0cmluZ1wiID8gZXZhbCh0ZXN0RngpIDogdGVzdEZ4KCkpLCAvLzwgZGVmZW5zaXZlIGNvZGVcbiAgICBpbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydCA8IG1heHRpbWVPdXRNaWxsaXMpICYmICFjb25kaXRpb24pIHtcbiAgICAgICAgLy8gSWYgbm90IHRpbWUtb3V0IHlldCBhbmQgY29uZGl0aW9uIG5vdCB5ZXQgZnVsZmlsbGVkXG4gICAgICAgIGNvbmRpdGlvbiA9ICh0eXBlb2YgKHRlc3RGeCkgPT09IFwic3RyaW5nXCIgPyBldmFsKHRlc3RGeCkgOiB0ZXN0RngoKSk7IC8vPCBkZWZlbnNpdmUgY29kZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgICAgICAvLyBJZiBjb25kaXRpb24gc3RpbGwgbm90IGZ1bGZpbGxlZCAodGltZW91dCBidXQgY29uZGl0aW9uIGlzICdmYWxzZScpXG4gICAgICAgICAgY29uc29sZS5sb2coXCInd2FpdEZvcigpJyB0aW1lb3V0XCIpO1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyAvLzwgU3RvcCB0aGlzIGludGVydmFsXG4gICAgICAgICAgdHlwZW9mIChvblJlYWR5KSA9PT0gXCJzdHJpbmdcIiA/IGV2YWwob25SZWFkeSkgOiBvblJlYWR5KCd0aW1lb3V0Jyk7IC8vPCBEbyB3aGF0IGl0J3Mgc3VwcG9zZWQgdG8gZG8gb25jZSB0aGUgY29uZGl0aW9uIGlzIGZ1bGZpbGxlZFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENvbmRpdGlvbiBmdWxmaWxsZWQgKHRpbWVvdXQgYW5kL29yIGNvbmRpdGlvbiBpcyAndHJ1ZScpXG4gICAgICAgICAgY29uc29sZS5sb2coXCInd2FpdEZvcigpJyBmaW5pc2hlZCBpbiBcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0KSArIFwibXMuXCIpO1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpOyAvLzwgU3RvcCB0aGlzIGludGVydmFsXG4gICAgICAgICAgdHlwZW9mIChvblJlYWR5KSA9PT0gXCJzdHJpbmdcIiA/IGV2YWwob25SZWFkeSkgOiBvblJlYWR5KCdzdWNjZXNzJyk7IC8vPCBEbyB3aGF0IGl0J3Mgc3VwcG9zZWQgdG8gZG8gb25jZSB0aGUgY29uZGl0aW9uIGlzIGZ1bGZpbGxlZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgNTApOyAvLzwgcmVwZWF0IGNoZWNrIGV2ZXJ5IDUwbXNcbn07IiwidmFyIFZlY3RvclRpbGUgPSByZXF1aXJlKCd2ZWN0b3ItdGlsZScpLlZlY3RvclRpbGU7XG52YXIgUHJvdG9idWYgPSByZXF1aXJlKCdwYmYnKTtcbnZhciBQb2ludCA9IHJlcXVpcmUoJ3BvaW50LWdlb21ldHJ5Jyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vTVZUVXRpbCcpO1xudmFyIE1WVExheWVyID0gcmVxdWlyZSgnLi9NVlRMYXllcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTC5UaWxlTGF5ZXIuTVZUU291cmNlID0gTC5UaWxlTGF5ZXIuQ2FudmFzLmV4dGVuZCh7XG5cbiAgb3B0aW9uczoge1xuICAgIGRlYnVnOiBmYWxzZSxcbiAgICB1cmw6IFwiXCIsIC8vVVJMIFRPIFZlY3RvciBUaWxlIFNvdXJjZSxcbiAgICBnZXRJREZvckxheWVyRmVhdHVyZTogZnVuY3Rpb24oKSB7fSxcbiAgICB0aWxlU2l6ZTogMjU2LFxuICAgIHZpc2libGVMYXllcnM6IFtdXG4gIH0sXG4gIGxheWVyczoge30sIC8vS2VlcCBhIGxpc3Qgb2YgdGhlIGxheWVycyBjb250YWluZWQgaW4gdGhlIFBCRnNcbiAgcHJvY2Vzc2VkVGlsZXM6IHt9LCAvL0tlZXAgYSBsaXN0IG9mIHRpbGVzIHRoYXQgaGF2ZSBiZWVuIHByb2Nlc3NlZCBhbHJlYWR5XG4gIF9ldmVudEhhbmRsZXJzOiB7fSxcbiAgX3RyaWdnZXJPblRpbGVzTG9hZGVkRXZlbnQ6IHRydWUsIC8vd2hldGhlciBvciBub3QgdG8gZmlyZSB0aGUgb25UaWxlc0xvYWRlZCBldmVudCB3aGVuIGFsbCBvZiB0aGUgdGlsZXMgZmluaXNoIGxvYWRpbmcuXG4gIF91cmw6IFwiXCIsIC8vaW50ZXJuYWwgVVJMIHByb3BlcnR5XG5cbiAgc3R5bGU6IGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICB2YXIgc3R5bGUgPSB7fTtcblxuICAgIHZhciB0eXBlID0gZmVhdHVyZS50eXBlO1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSAxOiAvLydQb2ludCdcbiAgICAgICAgc3R5bGUuY29sb3IgPSAncmdiYSg0OSw3OSw3OSwxKSc7XG4gICAgICAgIHN0eWxlLnJhZGl1cyA9IDU7XG4gICAgICAgIHN0eWxlLnNlbGVjdGVkID0ge1xuICAgICAgICAgIGNvbG9yOiAncmdiYSgyNTUsMjU1LDAsMC41KScsXG4gICAgICAgICAgcmFkaXVzOiA2XG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOiAvLydMaW5lU3RyaW5nJ1xuICAgICAgICBzdHlsZS5jb2xvciA9ICdyZ2JhKDE2MSwyMTcsMTU1LDAuOCknO1xuICAgICAgICBzdHlsZS5zaXplID0gMztcbiAgICAgICAgc3R5bGUuc2VsZWN0ZWQgPSB7XG4gICAgICAgICAgY29sb3I6ICdyZ2JhKDI1NSwyNSwwLDAuNSknLFxuICAgICAgICAgIHNpemU6IDRcbiAgICAgICAgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6IC8vJ1BvbHlnb24nXG4gICAgICAgIHN0eWxlLmNvbG9yID0gJ3JnYmEoNDksNzksNzksMSknO1xuICAgICAgICBzdHlsZS5vdXRsaW5lID0ge1xuICAgICAgICAgIGNvbG9yOiAncmdiYSgxNjEsMjE3LDE1NSwwLjgpJyxcbiAgICAgICAgICBzaXplOiAxXG4gICAgICAgIH07XG4gICAgICAgIHN0eWxlLnNlbGVjdGVkID0ge1xuICAgICAgICAgIGNvbG9yOiAncmdiYSgyNTUsMTQwLDAsMC4zKScsXG4gICAgICAgICAgb3V0bGluZToge1xuICAgICAgICAgICAgY29sb3I6ICdyZ2JhKDI1NSwxNDAsMCwxKScsXG4gICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHN0eWxlO1xuICB9LFxuXG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgLy9hIGxpc3Qgb2YgdGhlIGxheWVycyBjb250YWluZWQgaW4gdGhlIFBCRnNcbiAgICB0aGlzLmxheWVycyA9IHt9O1xuXG4gICAgLy8gdGlsZXMgY3VycmVudGx5IGluIHRoZSB2aWV3cG9ydFxuICAgIHRoaXMuYWN0aXZlVGlsZXMgPSB7fTtcblxuICAgIC8vIHRoYXRzIHRoYXQgaGF2ZSBiZWVuIGxvYWRlZCBhbmQgZHJhd25cbiAgICB0aGlzLmxvYWRlZFRpbGVzID0ge307XG5cbiAgICB0aGlzLl91cmwgPSB0aGlzLm9wdGlvbnMudXJsO1xuXG4gICAgLyoqXG4gICAgICogRm9yIHNvbWUgcmVhc29uLCBMZWFmbGV0IGhhcyBzb21lIGNvZGUgdGhhdCByZXNldHMgdGhlXG4gICAgICogeiBpbmRleCBpbiB0aGUgb3B0aW9ucyBvYmplY3QuIEknbSBoYXZpbmcgdHJvdWJsZSB0cmFja2luZ1xuICAgICAqIGRvd24gZXhhY3RseSB3aGF0IGRvZXMgdGhpcyBhbmQgd2h5LCBzbyBmb3Igbm93LCB3ZSBzaG91bGRcbiAgICAgKiBqdXN0IGNvcHkgdGhlIHZhbHVlIHRvIHRoaXMuekluZGV4IHNvIHdlIGNhbiBoYXZlIHRoZSByaWdodFxuICAgICAqIG51bWJlciB3aGVuIHdlIG1ha2UgdGhlIHN1YnNlcXVlbnQgTVZUTGF5ZXJzLlxuICAgICAqL1xuICAgIHRoaXMuekluZGV4ID0gb3B0aW9ucy56SW5kZXg7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3R5bGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuc3R5bGUgPSBvcHRpb25zLnN0eWxlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hamF4U291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmFqYXhTb3VyY2UgPSBvcHRpb25zLmFqYXhTb3VyY2U7XG4gICAgfVxuXG4gICAgdGhpcy5sYXllckxpbmsgPSBvcHRpb25zLmxheWVyTGluaztcblxuICAgIHRoaXMuX2V2ZW50SGFuZGxlcnMgPSB7fTtcblxuICAgIHRoaXMuX3RpbGVzVG9Qcm9jZXNzID0gMDsgLy9zdG9yZSB0aGUgbWF4IG51bWJlciBvZiB0aWxlcyB0byBiZSBsb2FkZWQuICBMYXRlciwgd2UgY2FuIHVzZSB0aGlzIGNvdW50IHRvIGNvdW50IGRvd24gUEJGIGxvYWRpbmcuXG4gIH0sXG5cbiAgcmVkcmF3OiBmdW5jdGlvbih0cmlnZ2VyT25UaWxlc0xvYWRlZEV2ZW50KXtcbiAgICAvL09ubHkgc2V0IHRvIGZhbHNlIGlmIGl0IGFjdHVhbGx5IGlzIHBhc3NlZCBpbiBhcyAnZmFsc2UnXG4gICAgaWYgKHRyaWdnZXJPblRpbGVzTG9hZGVkRXZlbnQgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLl90cmlnZ2VyT25UaWxlc0xvYWRlZEV2ZW50ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgTC5UaWxlTGF5ZXIuQ2FudmFzLnByb3RvdHlwZS5yZWRyYXcuY2FsbCh0aGlzKTtcbiAgfSxcblxuICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYubWFwID0gbWFwO1xuICAgIEwuVGlsZUxheWVyLkNhbnZhcy5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuXG4gICAgdmFyIG1hcE9uQ2xpY2tDYWxsYmFjayA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHNlbGYuX29uQ2xpY2soZSk7XG4gICAgfTtcblxuICAgIG1hcC5vbignY2xpY2snLCBtYXBPbkNsaWNrQ2FsbGJhY2spO1xuXG4gICAgbWFwLm9uKFwibGF5ZXJyZW1vdmVcIiwgZnVuY3Rpb24oZSkge1xuICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoZSBsYXllciByZW1vdmVkIGlzIHRoaXMgb25lXG4gICAgICAvLyBjYWxsIGEgbWV0aG9kIHRvIHJlbW92ZSB0aGUgY2hpbGQgbGF5ZXJzICh0aGUgb25lcyB0aGF0IGFjdHVhbGx5IGhhdmUgc29tZXRoaW5nIGRyYXduIG9uIHRoZW0pLlxuICAgICAgaWYgKGUubGF5ZXIuX2xlYWZsZXRfaWQgPT09IHNlbGYuX2xlYWZsZXRfaWQgJiYgZS5sYXllci5yZW1vdmVDaGlsZExheWVycykge1xuICAgICAgICBlLmxheWVyLnJlbW92ZUNoaWxkTGF5ZXJzKG1hcCk7XG4gICAgICAgIG1hcC5vZmYoJ2NsaWNrJywgbWFwT25DbGlja0NhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHNlbGYuYWRkQ2hpbGRMYXllcnMobWFwKTtcblxuICAgIGlmICh0eXBlb2YgRHluYW1pY0xhYmVsID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgdGhpcy5keW5hbWljTGFiZWwgPSBuZXcgRHluYW1pY0xhYmVsKG1hcCwgdGhpcywge30pO1xuICAgIH1cblxuICB9LFxuXG4gIGRyYXdUaWxlOiBmdW5jdGlvbihjYW52YXMsIHRpbGVQb2ludCwgem9vbSkge1xuICAgIHZhciBjdHggPSB7XG4gICAgICBpZDogW3pvb20sIHRpbGVQb2ludC54LCB0aWxlUG9pbnQueV0uam9pbihcIjpcIiksXG4gICAgICBjYW52YXM6IGNhbnZhcyxcbiAgICAgIHRpbGU6IHRpbGVQb2ludCxcbiAgICAgIHpvb206IHpvb20sXG4gICAgICB0aWxlU2l6ZTogdGhpcy5vcHRpb25zLnRpbGVTaXplXG4gICAgfTtcblxuICAgIC8vQ2FwdHVyZSB0aGUgbWF4IG51bWJlciBvZiB0aGUgdGlsZXMgdG8gbG9hZCBoZXJlLiB0aGlzLl90aWxlc1RvUHJvY2VzcyBpcyBhbiBpbnRlcm5hbCBudW1iZXIgd2UgdXNlIHRvIGtub3cgd2hlbiB3ZSd2ZSBmaW5pc2hlZCByZXF1ZXN0aW5nIFBCRnMuXG4gICAgaWYodGhpcy5fdGlsZXNUb1Byb2Nlc3MgPCB0aGlzLl90aWxlc1RvTG9hZCkgdGhpcy5fdGlsZXNUb1Byb2Nlc3MgPSB0aGlzLl90aWxlc1RvTG9hZDtcblxuICAgIHZhciBpZCA9IGN0eC5pZCA9IFV0aWwuZ2V0Q29udGV4dElEKGN0eCk7XG4gICAgdGhpcy5hY3RpdmVUaWxlc1tpZF0gPSBjdHg7XG5cbiAgICBpZighdGhpcy5wcm9jZXNzZWRUaWxlc1tjdHguem9vbV0pIHRoaXMucHJvY2Vzc2VkVGlsZXNbY3R4Lnpvb21dID0ge307XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICB0aGlzLl9kcmF3RGVidWdJbmZvKGN0eCk7XG4gICAgfVxuICAgIHRoaXMuX2RyYXcoY3R4KTtcbiAgfSxcblxuICBzZXRPcGFjaXR5OmZ1bmN0aW9uKG9wYWNpdHkpIHtcbiAgICB0aGlzLl9zZXRWaXNpYmxlTGF5ZXJzU3R5bGUoJ29wYWNpdHknLG9wYWNpdHkpO1xuICB9LFxuXG4gIHNldFpJbmRleDpmdW5jdGlvbih6SW5kZXgpIHtcbiAgICB0aGlzLl9zZXRWaXNpYmxlTGF5ZXJzU3R5bGUoJ3pJbmRleCcsekluZGV4KTtcbiAgfSxcblxuICBfc2V0VmlzaWJsZUxheWVyc1N0eWxlOmZ1bmN0aW9uKHN0eWxlLCB2YWx1ZSkge1xuICAgIGZvcih2YXIga2V5IGluIHRoaXMubGF5ZXJzKSB7XG4gICAgICB0aGlzLmxheWVyc1trZXldLl90aWxlQ29udGFpbmVyLnN0eWxlW3N0eWxlXSA9IHZhbHVlO1xuICAgIH1cbiAgfSxcblxuICBfZHJhd0RlYnVnSW5mbzogZnVuY3Rpb24oY3R4KSB7XG4gICAgdmFyIG1heCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICB2YXIgZyA9IGN0eC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBnLnN0cm9rZVN0eWxlID0gJyMwMDAwMDAnO1xuICAgIGcuZmlsbFN0eWxlID0gJyNGRkZGMDAnO1xuICAgIGcuc3Ryb2tlUmVjdCgwLCAwLCBtYXgsIG1heCk7XG4gICAgZy5mb250ID0gXCIxMnB4IEFyaWFsXCI7XG4gICAgZy5maWxsUmVjdCgwLCAwLCA1LCA1KTtcbiAgICBnLmZpbGxSZWN0KDAsIG1heCAtIDUsIDUsIDUpO1xuICAgIGcuZmlsbFJlY3QobWF4IC0gNSwgMCwgNSwgNSk7XG4gICAgZy5maWxsUmVjdChtYXggLSA1LCBtYXggLSA1LCA1LCA1KTtcbiAgICBnLmZpbGxSZWN0KG1heCAvIDIgLSA1LCBtYXggLyAyIC0gNSwgMTAsIDEwKTtcbiAgICBnLnN0cm9rZVRleHQoY3R4Lnpvb20gKyAnICcgKyBjdHgudGlsZS54ICsgJyAnICsgY3R4LnRpbGUueSwgbWF4IC8gMiAtIDMwLCBtYXggLyAyIC0gMTApO1xuICB9LFxuXG4gIF9kcmF3OiBmdW5jdGlvbihjdHgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbi8vICAgIC8vVGhpcyB3b3JrcyB0byBza2lwIGZldGNoaW5nIGFuZCBwcm9jZXNzaW5nIHRpbGVzIGlmIHRoZXkndmUgYWxyZWFkeSBiZWVuIHByb2Nlc3NlZC5cbi8vICAgIHZhciB2ZWN0b3JUaWxlID0gdGhpcy5wcm9jZXNzZWRUaWxlc1tjdHguem9vbV1bY3R4LmlkXTtcbi8vICAgIC8vaWYgd2UndmUgYWxyZWFkeSBwYXJzZWQgaXQsIGRvbid0IGdldCBpdCBhZ2Fpbi5cbi8vICAgIGlmKHZlY3RvclRpbGUpe1xuLy8gICAgICBjb25zb2xlLmxvZyhcIlNraXBwaW5nIGZldGNoaW5nIFwiICsgY3R4LmlkKTtcbi8vICAgICAgc2VsZi5jaGVja1ZlY3RvclRpbGVMYXllcnMocGFyc2VWVCh2ZWN0b3JUaWxlKSwgY3R4LCB0cnVlKTtcbi8vICAgICAgc2VsZi5yZWR1Y2VUaWxlc1RvUHJvY2Vzc0NvdW50KCk7XG4vLyAgICAgIHJldHVybjtcbi8vICAgIH1cblxuICAgIGlmICghdGhpcy5fdXJsKSByZXR1cm47XG4gICAgdmFyIHNyYyA9IHRoaXMuZ2V0VGlsZVVybCh7IHg6IGN0eC50aWxlLngsIHk6IGN0eC50aWxlLnksIHo6IGN0eC56b29tIH0pO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh4aHIuc3RhdHVzID09IFwiMjAwXCIpIHtcblxuICAgICAgICBpZigheGhyLnJlc3BvbnNlKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGFycmF5QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgdmFyIGJ1ZiA9IG5ldyBQcm90b2J1ZihhcnJheUJ1ZmZlcik7XG4gICAgICAgIHZhciB2dCA9IG5ldyBWZWN0b3JUaWxlKGJ1Zik7XG4gICAgICAgIC8vQ2hlY2sgdGhlIGN1cnJlbnQgbWFwIGxheWVyIHpvb20uICBJZiBmYXN0IHpvb21pbmcgaXMgb2NjdXJyaW5nLCB0aGVuIHNob3J0IGNpcmN1aXQgdGlsZXMgdGhhdCBhcmUgZm9yIGEgZGlmZmVyZW50IHpvb20gbGV2ZWwgdGhhbiB3ZSdyZSBjdXJyZW50bHkgb24uXG4gICAgICAgIGlmKHNlbGYubWFwICYmIHNlbGYubWFwLmdldFpvb20oKSAhPSBjdHguem9vbSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiRmV0Y2hlZCB0aWxlIGZvciB6b29tIGxldmVsIFwiICsgY3R4Lnpvb20gKyBcIi4gTWFwIGlzIGF0IHpvb20gbGV2ZWwgXCIgKyBzZWxmLl9tYXAuZ2V0Wm9vbSgpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5jaGVja1ZlY3RvclRpbGVMYXllcnMocGFyc2VWVCh2dCksIGN0eCk7XG4gICAgICAgIHRpbGVMb2FkZWQoc2VsZiwgY3R4KTtcbiAgICAgIH1cblxuICAgICAgLy9laXRoZXIgd2F5LCByZWR1Y2UgdGhlIGNvdW50IG9mIHRpbGVzVG9Qcm9jZXNzIHRpbGVzIGhlcmVcbiAgICAgIHNlbGYucmVkdWNlVGlsZXNUb1Byb2Nlc3NDb3VudCgpO1xuICAgIH07XG5cbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc29sZS5sb2coXCJ4aHIgZXJyb3I6IFwiICsgeGhyLnN0YXR1cylcbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIHNyYywgdHJ1ZSk7IC8vYXN5bmMgaXMgdHJ1ZVxuICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgIHhoci5zZW5kKCk7XG4gIH0sXG5cbiAgcmVkdWNlVGlsZXNUb1Byb2Nlc3NDb3VudDogZnVuY3Rpb24oKXtcbiAgICB0aGlzLl90aWxlc1RvUHJvY2Vzcy0tO1xuICAgIGlmKCF0aGlzLl90aWxlc1RvUHJvY2Vzcyl7XG4gICAgICAvL1RyaWdnZXIgZXZlbnQgbGV0dGluZyB1cyBrbm93IHRoYXQgYWxsIFBCRnMgaGF2ZSBiZWVuIGxvYWRlZCBhbmQgcHJvY2Vzc2VkIChvciA0MDQnZCkuXG4gICAgICBpZih0aGlzLl9ldmVudEhhbmRsZXJzW1wiUEJGTG9hZFwiXSkgdGhpcy5fZXZlbnRIYW5kbGVyc1tcIlBCRkxvYWRcIl0oKTtcbiAgICAgIHRoaXMuX3BiZkxvYWRlZCgpO1xuICAgIH1cbiAgfSxcblxuICBjaGVja1ZlY3RvclRpbGVMYXllcnM6IGZ1bmN0aW9uKHZ0LCBjdHgsIHBhcnNlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vQ2hlY2sgaWYgdGhlcmUgYXJlIHNwZWNpZmllZCB2aXNpYmxlIGxheWVyc1xuICAgIGlmKHNlbGYub3B0aW9ucy52aXNpYmxlTGF5ZXJzICYmIHNlbGYub3B0aW9ucy52aXNpYmxlTGF5ZXJzLmxlbmd0aCA+IDApe1xuICAgICAgLy9vbmx5IGxldCB0aHJ1IHRoZSBsYXllcnMgbGlzdGVkIGluIHRoZSB2aXNpYmxlTGF5ZXJzIGFycmF5XG4gICAgICBmb3IodmFyIGk9MDsgaSA8IHNlbGYub3B0aW9ucy52aXNpYmxlTGF5ZXJzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgdmFyIGxheWVyTmFtZSA9IHNlbGYub3B0aW9ucy52aXNpYmxlTGF5ZXJzW2ldO1xuICAgICAgICBpZih2dC5sYXllcnNbbGF5ZXJOYW1lXSl7XG4gICAgICAgICAgIC8vUHJvY2VlZCB3aXRoIHBhcnNpbmdcbiAgICAgICAgICBzZWxmLnByZXBhcmVNVlRMYXllcnModnQubGF5ZXJzW2xheWVyTmFtZV0sIGxheWVyTmFtZSwgY3R4LCBwYXJzZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfWVsc2V7XG4gICAgICAvL1BhcnNlIGFsbCB2dC5sYXllcnNcbiAgICAgIGZvciAodmFyIGtleSBpbiB2dC5sYXllcnMpIHtcbiAgICAgICAgc2VsZi5wcmVwYXJlTVZUTGF5ZXJzKHZ0LmxheWVyc1trZXldLCBrZXksIGN0eCwgcGFyc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcHJlcGFyZU1WVExheWVyczogZnVuY3Rpb24obHlyICxrZXksIGN0eCwgcGFyc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKCFzZWxmLmxheWVyc1trZXldKSB7XG4gICAgICAvL0NyZWF0ZSBNVlRMYXllciBvciBNVlRQb2ludExheWVyIGZvciB1c2VyXG4gICAgICBzZWxmLmxheWVyc1trZXldID0gc2VsZi5jcmVhdGVNVlRMYXllcihrZXksIGx5ci5wYXJzZWRGZWF0dXJlc1swXS50eXBlIHx8IG51bGwpO1xuICAgIH1cblxuICAgIGlmIChwYXJzZWQpIHtcbiAgICAgIC8vV2UndmUgYWxyZWFkeSBwYXJzZWQgaXQuICBHbyBnZXQgY2FudmFzIGFuZCBkcmF3LlxuICAgICAgc2VsZi5sYXllcnNba2V5XS5nZXRDYW52YXMoY3R4LCBseXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLmxheWVyc1trZXldLnBhcnNlVmVjdG9yVGlsZUxheWVyKGx5ciwgY3R4KTtcbiAgICB9XG5cbiAgfSxcblxuICBjcmVhdGVNVlRMYXllcjogZnVuY3Rpb24oa2V5LCB0eXBlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIGdldElERm9yTGF5ZXJGZWF0dXJlO1xuICAgIGlmICh0eXBlb2Ygc2VsZi5vcHRpb25zLmdldElERm9yTGF5ZXJGZWF0dXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnZXRJREZvckxheWVyRmVhdHVyZSA9IHNlbGYub3B0aW9ucy5nZXRJREZvckxheWVyRmVhdHVyZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2V0SURGb3JMYXllckZlYXR1cmUgPSBVdGlsLmdldElERm9yTGF5ZXJGZWF0dXJlO1xuICAgIH1cblxuICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgZ2V0SURGb3JMYXllckZlYXR1cmU6IGdldElERm9yTGF5ZXJGZWF0dXJlLFxuICAgICAgZmlsdGVyOiBzZWxmLm9wdGlvbnMuZmlsdGVyLFxuICAgICAgbGF5ZXJPcmRlcmluZzogc2VsZi5vcHRpb25zLmxheWVyT3JkZXJpbmcsXG4gICAgICBzdHlsZTogc2VsZi5zdHlsZSxcbiAgICAgIG5hbWU6IGtleSxcbiAgICAgIGFzeW5jaDogdHJ1ZVxuICAgIH07XG5cbiAgICBpZiAoc2VsZi5vcHRpb25zLnpJbmRleCkge1xuICAgICAgb3B0aW9ucy56SW5kZXggPSBzZWxmLnpJbmRleDtcbiAgICB9XG5cbiAgICAvL1Rha2UgdGhlIGxheWVyIGFuZCBjcmVhdGUgYSBuZXcgTVZUTGF5ZXIgb3IgTVZUUG9pbnRMYXllciBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICB2YXIgbGF5ZXIgPSBuZXcgTVZUTGF5ZXIoc2VsZiwgb3B0aW9ucykuYWRkVG8oc2VsZi5tYXApO1xuXG4gICAgcmV0dXJuIGxheWVyO1xuICB9LFxuXG4gIGdldExheWVyczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMubGF5ZXJzO1xuICB9LFxuXG4gIGhpZGVMYXllcjogZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAodGhpcy5sYXllcnNbaWRdKSB7XG4gICAgICB0aGlzLl9tYXAucmVtb3ZlTGF5ZXIodGhpcy5sYXllcnNbaWRdKTtcbiAgICAgIGlmKHRoaXMub3B0aW9ucy52aXNpYmxlTGF5ZXJzLmluZGV4T2YoXCJpZFwiKSA+IC0xKXtcbiAgICAgICAgdGhpcy52aXNpYmxlTGF5ZXJzLnNwbGljZSh0aGlzLm9wdGlvbnMudmlzaWJsZUxheWVycy5pbmRleE9mKFwiaWRcIiksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBzaG93TGF5ZXI6IGZ1bmN0aW9uKGlkKSB7XG4gICAgaWYgKHRoaXMubGF5ZXJzW2lkXSkge1xuICAgICAgdGhpcy5fbWFwLmFkZExheWVyKHRoaXMubGF5ZXJzW2lkXSk7XG4gICAgICBpZih0aGlzLm9wdGlvbnMudmlzaWJsZUxheWVycy5pbmRleE9mKFwiaWRcIikgPT0gLTEpe1xuICAgICAgICB0aGlzLnZpc2libGVMYXllcnMucHVzaChpZCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vTWFrZSBzdXJlIG1hbmFnZXIgbGF5ZXIgaXMgYWx3YXlzIGluIGZyb250XG4gICAgdGhpcy5icmluZ1RvRnJvbnQoKTtcbiAgfSxcblxuICByZW1vdmVDaGlsZExheWVyczogZnVuY3Rpb24obWFwKXtcbiAgICAvL1JlbW92ZSBjaGlsZCBsYXllcnMgb2YgdGhpcyBncm91cCBsYXllclxuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmxheWVycykge1xuICAgICAgdmFyIGxheWVyID0gdGhpcy5sYXllcnNba2V5XTtcbiAgICAgIG1hcC5yZW1vdmVMYXllcihsYXllcik7XG4gICAgfVxuICB9LFxuXG4gIGFkZENoaWxkTGF5ZXJzOiBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYoc2VsZi5vcHRpb25zLnZpc2libGVMYXllcnMubGVuZ3RoID4gMCl7XG4gICAgICAvL29ubHkgbGV0IHRocnUgdGhlIGxheWVycyBsaXN0ZWQgaW4gdGhlIHZpc2libGVMYXllcnMgYXJyYXlcbiAgICAgIGZvcih2YXIgaT0wOyBpIDwgc2VsZi5vcHRpb25zLnZpc2libGVMYXllcnMubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgbGF5ZXJOYW1lID0gc2VsZi5vcHRpb25zLnZpc2libGVMYXllcnNbaV07XG4gICAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2xheWVyTmFtZV07XG4gICAgICAgIGlmKGxheWVyKXtcbiAgICAgICAgICAvL1Byb2NlZWQgd2l0aCBwYXJzaW5nXG4gICAgICAgICAgbWFwLmFkZExheWVyKGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgLy9BZGQgYWxsIGxheWVyc1xuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMubGF5ZXJzKSB7XG4gICAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2tleV07XG4gICAgICAgIC8vIGxheWVyIGlzIHNldCB0byB2aXNpYmxlIGFuZCBpcyBub3QgYWxyZWFkeSBvbiBtYXBcbiAgICAgICAgaWYgKCFsYXllci5fbWFwKSB7XG4gICAgICAgICAgbWFwLmFkZExheWVyKGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBiaW5kOiBmdW5jdGlvbihldmVudFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5fZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdID0gY2FsbGJhY2s7XG4gIH0sXG5cbiAgX29uQ2xpY2s6IGZ1bmN0aW9uKGV2dCkge1xuICAgIC8vSGVyZSwgcGFzcyB0aGUgZXZlbnQgb24gdG8gdGhlIGNoaWxkIE1WVExheWVyIGFuZCBoYXZlIGl0IGRvIHRoZSBoaXQgdGVzdCBhbmQgaGFuZGxlIHRoZSByZXN1bHQuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBvbkNsaWNrID0gc2VsZi5vcHRpb25zLm9uQ2xpY2s7XG4gICAgdmFyIGNsaWNrYWJsZUxheWVycyA9IHNlbGYub3B0aW9ucy5jbGlja2FibGVMYXllcnM7XG4gICAgdmFyIGxheWVycyA9IHNlbGYubGF5ZXJzO1xuXG4gICAgZXZ0LnRpbGVJRCA9ICBnZXRUaWxlVVJMKGV2dC5sYXRsbmcubGF0LCBldnQubGF0bG5nLmxuZywgdGhpcy5tYXAuZ2V0Wm9vbSgpKTtcblxuICAgIC8vIFdlIG11c3QgaGF2ZSBhbiBhcnJheSBvZiBjbGlja2FibGUgbGF5ZXJzLCBvdGhlcndpc2UsIHdlIGp1c3QgcGFzc1xuICAgIC8vIHRoZSBldmVudCB0byB0aGUgcHVibGljIG9uQ2xpY2sgY2FsbGJhY2sgaW4gb3B0aW9ucy5cblxuICAgIGlmKCFjbGlja2FibGVMYXllcnMpe1xuICAgICAgY2xpY2thYmxlTGF5ZXJzID0gT2JqZWN0LmtleXMoc2VsZi5sYXllcnMpO1xuICAgIH1cblxuICAgIGlmIChjbGlja2FibGVMYXllcnMgJiYgY2xpY2thYmxlTGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjbGlja2FibGVMYXllcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGNsaWNrYWJsZUxheWVyc1tpXTtcbiAgICAgICAgdmFyIGxheWVyID0gbGF5ZXJzW2tleV07XG4gICAgICAgIGlmIChsYXllcikge1xuICAgICAgICAgIGxheWVyLmhhbmRsZUNsaWNrRXZlbnQoZXZ0LCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb25DbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICBvbkNsaWNrKGV2dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHR5cGVvZiBvbkNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIG9uQ2xpY2soZXZ0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfSxcblxuICBzZXRGaWx0ZXI6IGZ1bmN0aW9uKGZpbHRlckZ1bmN0aW9uLCBsYXllck5hbWUpIHtcbiAgICAvL3Rha2UgaW4gYSBuZXcgZmlsdGVyIGZ1bmN0aW9uLlxuICAgIC8vUHJvcGFnYXRlIHRvIGNoaWxkIGxheWVycy5cblxuICAgIC8vQWRkIGZpbHRlciB0byBhbGwgY2hpbGQgbGF5ZXJzIGlmIG5vIGxheWVyIGlzIHNwZWNpZmllZC5cbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5sYXllcnMpIHtcbiAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2tleV07XG5cbiAgICAgIGlmIChsYXllck5hbWUpe1xuICAgICAgICBpZihrZXkudG9Mb3dlckNhc2UoKSA9PSBsYXllck5hbWUudG9Mb3dlckNhc2UoKSl7XG4gICAgICAgICAgbGF5ZXIub3B0aW9ucy5maWx0ZXIgPSBmaWx0ZXJGdW5jdGlvbjsgLy9Bc3NpZ24gZmlsdGVyIHRvIGNoaWxkIGxheWVyLCBvbmx5IGlmIG5hbWUgbWF0Y2hlc1xuICAgICAgICAgIC8vQWZ0ZXIgZmlsdGVyIGlzIHNldCwgdGhlIG9sZCBmZWF0dXJlIGhhc2hlcyBhcmUgaW52YWxpZC4gIENsZWFyIHRoZW0gZm9yIG5leHQgZHJhdy5cbiAgICAgICAgICBsYXllci5jbGVhckxheWVyRmVhdHVyZUhhc2goKTtcbiAgICAgICAgICAvL2xheWVyLmNsZWFyVGlsZUZlYXR1cmVIYXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGxheWVyLm9wdGlvbnMuZmlsdGVyID0gZmlsdGVyRnVuY3Rpb247IC8vQXNzaWduIGZpbHRlciB0byBjaGlsZCBsYXllclxuICAgICAgICAvL0FmdGVyIGZpbHRlciBpcyBzZXQsIHRoZSBvbGQgZmVhdHVyZSBoYXNoZXMgYXJlIGludmFsaWQuICBDbGVhciB0aGVtIGZvciBuZXh0IGRyYXcuXG4gICAgICAgIGxheWVyLmNsZWFyTGF5ZXJGZWF0dXJlSGFzaCgpO1xuICAgICAgICAvL2xheWVyLmNsZWFyVGlsZUZlYXR1cmVIYXNoKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBUYWtlIGluIGEgbmV3IHN0eWxlIGZ1bmN0aW9uIGFuZCBwcm9wb2dhdGUgdG8gY2hpbGQgbGF5ZXJzLlxuICAgKiBJZiB5b3UgZG8gbm90IHNldCBhIGxheWVyIG5hbWUsIGl0IHJlc2V0cyB0aGUgc3R5bGUgZm9yIGFsbCBvZiB0aGUgbGF5ZXJzLlxuICAgKiBAcGFyYW0gc3R5bGVGdW5jdGlvblxuICAgKiBAcGFyYW0gbGF5ZXJOYW1lXG4gICAqL1xuICBzZXRTdHlsZTogZnVuY3Rpb24oc3R5bGVGbiwgbGF5ZXJOYW1lKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubGF5ZXJzKSB7XG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyc1trZXldO1xuICAgICAgaWYgKGxheWVyTmFtZSkge1xuICAgICAgICBpZihrZXkudG9Mb3dlckNhc2UoKSA9PSBsYXllck5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgIGxheWVyLnNldFN0eWxlKHN0eWxlRm4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsYXllci5zZXRTdHlsZShzdHlsZUZuKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgZmVhdHVyZVNlbGVjdGVkOiBmdW5jdGlvbihtdnRGZWF0dXJlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5tdXRleFRvZ2dsZSkge1xuICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkRmVhdHVyZSkge1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEZlYXR1cmUuZGVzZWxlY3QoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NlbGVjdGVkRmVhdHVyZSA9IG12dEZlYXR1cmU7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vblNlbGVjdChtdnRGZWF0dXJlKTtcbiAgICB9XG4gIH0sXG5cbiAgZmVhdHVyZURlc2VsZWN0ZWQ6IGZ1bmN0aW9uKG12dEZlYXR1cmUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLm11dGV4VG9nZ2xlICYmIHRoaXMuX3NlbGVjdGVkRmVhdHVyZSkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRGZWF0dXJlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vbkRlc2VsZWN0KSB7XG4gICAgICB0aGlzLm9wdGlvbnMub25EZXNlbGVjdChtdnRGZWF0dXJlKTtcbiAgICB9XG4gIH0sXG5cbiAgX3BiZkxvYWRlZDogZnVuY3Rpb24oKSB7XG4gICAgLy9GaXJlcyB3aGVuIGFsbCB0aWxlcyBmcm9tIHRoaXMgbGF5ZXIgaGF2ZSBiZWVuIGxvYWRlZCBhbmQgZHJhd24gKG9yIDQwNCdkKS5cblxuICAgIC8vTWFrZSBzdXJlIG1hbmFnZXIgbGF5ZXIgaXMgYWx3YXlzIGluIGZyb250XG4gICAgdGhpcy5icmluZ1RvRnJvbnQoKTtcblxuICAgIC8vU2VlIGlmIHRoZXJlIGlzIGFuIGV2ZW50IHRvIGV4ZWN1dGVcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG9uVGlsZXNMb2FkZWQgPSBzZWxmLm9wdGlvbnMub25UaWxlc0xvYWRlZDtcblxuICAgIGlmIChvblRpbGVzTG9hZGVkICYmIHR5cGVvZiBvblRpbGVzTG9hZGVkID09PSAnZnVuY3Rpb24nICYmIHRoaXMuX3RyaWdnZXJPblRpbGVzTG9hZGVkRXZlbnQgPT09IHRydWUpIHtcbiAgICAgIG9uVGlsZXNMb2FkZWQodGhpcyk7XG4gICAgfVxuICAgIHNlbGYuX3RyaWdnZXJPblRpbGVzTG9hZGVkRXZlbnQgPSB0cnVlOyAvL3Jlc2V0IC0gaWYgcmVkcmF3KCkgaXMgY2FsbGVkIHdpdGggdGhlIG9wdGluYWwgJ2ZhbHNlJyBwYXJhbWV0ZXIgdG8gdGVtcG9yYXJpbHkgZGlzYWJsZSB0aGUgb25UaWxlc0xvYWRlZCBldmVudCBmcm9tIGZpcmluZy4gIFRoaXMgcmVzZXRzIGl0IGJhY2sgdG8gdHJ1ZSBhZnRlciBhIHNpbmdsZSB0aW1lIG9mIGZpcmluZyBhcyAnZmFsc2UnLlxuICB9XG5cbn0pO1xuXG5cbmlmICh0eXBlb2YoTnVtYmVyLnByb3RvdHlwZS50b1JhZCkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgTnVtYmVyLnByb3RvdHlwZS50b1JhZCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzICogTWF0aC5QSSAvIDE4MDtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRUaWxlVVJMKGxhdCwgbG9uLCB6b29tKSB7XG4gIHZhciB4dGlsZSA9IHBhcnNlSW50KE1hdGguZmxvb3IoIChsb24gKyAxODApIC8gMzYwICogKDE8PHpvb20pICkpO1xuICB2YXIgeXRpbGUgPSBwYXJzZUludChNYXRoLmZsb29yKCAoMSAtIE1hdGgubG9nKE1hdGgudGFuKGxhdC50b1JhZCgpKSArIDEgLyBNYXRoLmNvcyhsYXQudG9SYWQoKSkpIC8gTWF0aC5QSSkgLyAyICogKDE8PHpvb20pICkpO1xuICByZXR1cm4gXCJcIiArIHpvb20gKyBcIjpcIiArIHh0aWxlICsgXCI6XCIgKyB5dGlsZTtcbn1cblxuZnVuY3Rpb24gdGlsZUxvYWRlZChwYmZTb3VyY2UsIGN0eCkge1xuICBwYmZTb3VyY2UubG9hZGVkVGlsZXNbY3R4LmlkXSA9IGN0eDtcbn1cblxuZnVuY3Rpb24gcGFyc2VWVCh2dCl7XG4gIGZvciAodmFyIGtleSBpbiB2dC5sYXllcnMpIHtcbiAgICB2YXIgbHlyID0gdnQubGF5ZXJzW2tleV07XG4gICAgcGFyc2VWVEZlYXR1cmVzKGx5cik7XG4gIH1cbiAgcmV0dXJuIHZ0O1xufVxuXG5mdW5jdGlvbiBwYXJzZVZURmVhdHVyZXModnRsKXtcbiAgdnRsLnBhcnNlZEZlYXR1cmVzID0gW107XG4gIHZhciBmZWF0dXJlcyA9IHZ0bC5fZmVhdHVyZXM7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBmZWF0dXJlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciB2dGYgPSB2dGwuZmVhdHVyZShpKTtcbiAgICB2dGYuY29vcmRpbmF0ZXMgPSB2dGYubG9hZEdlb21ldHJ5KCk7XG4gICAgdnRsLnBhcnNlZEZlYXR1cmVzLnB1c2godnRmKTtcbiAgfVxuICByZXR1cm4gdnRsO1xufVxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IE5pY2hvbGFzIEhhbGxhaGFuIDxuaGFsbGFoYW5Ac3BhdGlhbGRldi5jb20+XG4gKiAgICAgICBvbiA4LzE1LzE0LlxuICovXG52YXIgVXRpbCA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cblV0aWwuZ2V0Q29udGV4dElEID0gZnVuY3Rpb24oY3R4KSB7XG4gIHJldHVybiBbY3R4Lnpvb20sIGN0eC50aWxlLngsIGN0eC50aWxlLnldLmpvaW4oXCI6XCIpO1xufTtcblxuLyoqXG4gKiBEZWZhdWx0IGZ1bmN0aW9uIHRoYXQgZ2V0cyB0aGUgaWQgZm9yIGEgbGF5ZXIgZmVhdHVyZS5cbiAqIFNvbWV0aW1lcyB0aGlzIG5lZWRzIHRvIGJlIGRvbmUgaW4gYSBkaWZmZXJlbnQgd2F5IGFuZFxuICogY2FuIGJlIHNwZWNpZmllZCBieSB0aGUgdXNlciBpbiB0aGUgb3B0aW9ucyBmb3IgTC5UaWxlTGF5ZXIuTVZUU291cmNlLlxuICpcbiAqIEBwYXJhbSBmZWF0dXJlXG4gKiBAcmV0dXJucyB7Y3R4LmlkfCp8aWR8c3RyaW5nfGpzdHMuaW5kZXguY2hhaW4uTW9ub3RvbmVDaGFpbi5pZHxudW1iZXJ9XG4gKi9cblV0aWwuZ2V0SURGb3JMYXllckZlYXR1cmUgPSBmdW5jdGlvbihmZWF0dXJlKSB7XG4gIHJldHVybiBmZWF0dXJlLnByb3BlcnRpZXMuaWQ7XG59O1xuXG5VdGlsLmdldEpTT04gPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gIHZhciB4bWxodHRwID0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG4gIHhtbGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YXR1cyA9IHhtbGh0dHAuc3RhdHVzO1xuICAgIGlmICh4bWxodHRwLnJlYWR5U3RhdGUgPT09IDQgJiYgc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDApIHtcbiAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZSh4bWxodHRwLnJlc3BvbnNlVGV4dCk7XG4gICAgICBjYWxsYmFjayhudWxsLCBqc29uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2soIHsgZXJyb3I6IHRydWUsIHN0YXR1czogc3RhdHVzIH0gKTtcbiAgICB9XG4gIH07XG4gIHhtbGh0dHAub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICB4bWxodHRwLnNlbmQoKTtcbn07XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgTmljaG9sYXMgSGFsbGFoYW4gPG5oYWxsYWhhbkBzcGF0aWFsZGV2LmNvbT5cbiAqICAgICAgIG9uIDcvMzEvMTQuXG4gKi9cbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vTVZUVXRpbCcpO1xubW9kdWxlLmV4cG9ydHMgPSBTdGF0aWNMYWJlbDtcblxuZnVuY3Rpb24gU3RhdGljTGFiZWwobXZ0RmVhdHVyZSwgY3R4LCBsYXRMbmcsIHN0eWxlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5tdnRGZWF0dXJlID0gbXZ0RmVhdHVyZTtcbiAgdGhpcy5tYXAgPSBtdnRGZWF0dXJlLm1hcDtcbiAgdGhpcy56b29tID0gY3R4Lnpvb207XG4gIHRoaXMubGF0TG5nID0gbGF0TG5nO1xuICB0aGlzLnNlbGVjdGVkID0gZmFsc2U7XG5cbiAgaWYgKG12dEZlYXR1cmUubGlua2VkRmVhdHVyZSkge1xuICAgIHZhciBsaW5rZWRGZWF0dXJlID0gbXZ0RmVhdHVyZS5saW5rZWRGZWF0dXJlKCk7XG4gICAgaWYgKGxpbmtlZEZlYXR1cmUgJiYgbGlua2VkRmVhdHVyZS5zZWxlY3RlZCkge1xuICAgICAgc2VsZi5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaW5pdChzZWxmLCBtdnRGZWF0dXJlLCBjdHgsIGxhdExuZywgc3R5bGUpXG59XG5cbmZ1bmN0aW9uIGluaXQoc2VsZiwgbXZ0RmVhdHVyZSwgY3R4LCBsYXRMbmcsIHN0eWxlKSB7XG4gIHZhciBhamF4RGF0YSA9IG12dEZlYXR1cmUuYWpheERhdGE7XG4gIHZhciBzdHkgPSBzZWxmLnN0eWxlID0gc3R5bGUuc3RhdGljTGFiZWwobXZ0RmVhdHVyZSwgYWpheERhdGEpO1xuICB2YXIgaWNvbiA9IHNlbGYuaWNvbiA9IEwuZGl2SWNvbih7XG4gICAgY2xhc3NOYW1lOiBzdHkuY3NzQ2xhc3MgfHwgJ2xhYmVsLWljb24tdGV4dCcsXG4gICAgaHRtbDogc3R5Lmh0bWwsXG4gICAgaWNvblNpemU6IHN0eS5pY29uU2l6ZSB8fCBbNTAsNTBdXG4gIH0pO1xuXG4gIHNlbGYubWFya2VyID0gTC5tYXJrZXIobGF0TG5nLCB7aWNvbjogaWNvbn0pLmFkZFRvKHNlbGYubWFwKTtcblxuICBpZiAoc2VsZi5zZWxlY3RlZCkge1xuICAgIHNlbGYubWFya2VyLl9pY29uLmNsYXNzTGlzdC5hZGQoc2VsZi5zdHlsZS5jc3NTZWxlY3RlZENsYXNzIHx8ICdsYWJlbC1pY29uLXRleHQtc2VsZWN0ZWQnKTtcbiAgfVxuXG4gIHNlbGYubWFya2VyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICBzZWxmLnRvZ2dsZSgpO1xuICB9KTtcblxuICBzZWxmLm1hcC5vbignem9vbWVuZCcsIGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgbmV3Wm9vbSA9IGUudGFyZ2V0LmdldFpvb20oKTtcbiAgICBpZiAoc2VsZi56b29tICE9PSBuZXdab29tKSB7XG4gICAgICBzZWxmLm1hcC5yZW1vdmVMYXllcihzZWxmLm1hcmtlcik7XG4gICAgfVxuICB9KTtcbn1cblxuXG5TdGF0aWNMYWJlbC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnNlbGVjdGVkKSB7XG4gICAgdGhpcy5kZXNlbGVjdCgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuc2VsZWN0KCk7XG4gIH1cbn07XG5cblN0YXRpY0xhYmVsLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zZWxlY3RlZCA9IHRydWU7XG4gIHRoaXMubWFya2VyLl9pY29uLmNsYXNzTGlzdC5hZGQodGhpcy5zdHlsZS5jc3NTZWxlY3RlZENsYXNzIHx8ICdsYWJlbC1pY29uLXRleHQtc2VsZWN0ZWQnKTtcbiAgdmFyIGxpbmtlZEZlYXR1cmUgPSB0aGlzLm12dEZlYXR1cmUubGlua2VkRmVhdHVyZSgpO1xuICBpZiAoIWxpbmtlZEZlYXR1cmUuc2VsZWN0ZWQpIGxpbmtlZEZlYXR1cmUuc2VsZWN0KCk7XG59O1xuXG5TdGF0aWNMYWJlbC5wcm90b3R5cGUuZGVzZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zZWxlY3RlZCA9IGZhbHNlO1xuICB0aGlzLm1hcmtlci5faWNvbi5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuc3R5bGUuY3NzU2VsZWN0ZWRDbGFzcyB8fCAnbGFiZWwtaWNvbi10ZXh0LXNlbGVjdGVkJyk7XG4gIHZhciBsaW5rZWRGZWF0dXJlID0gdGhpcy5tdnRGZWF0dXJlLmxpbmtlZEZlYXR1cmUoKTtcbiAgaWYgKGxpbmtlZEZlYXR1cmUuc2VsZWN0ZWQpIGxpbmtlZEZlYXR1cmUuZGVzZWxlY3QoKTtcbn07XG5cblN0YXRpY0xhYmVsLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLm1hcCB8fCAhdGhpcy5tYXJrZXIpIHJldHVybjtcbiAgdGhpcy5tYXAucmVtb3ZlTGF5ZXIodGhpcy5tYXJrZXIpO1xufTtcbiIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LCBTcGF0aWFsIERldmVsb3BtZW50IEludGVybmF0aW9uYWxcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogU291cmNlIGNvZGUgY2FuIGJlIGZvdW5kIGF0OlxuICogaHR0cHM6Ly9naXRodWIuY29tL1NwYXRpYWxTZXJ2ZXIvTGVhZmxldC5NYXBib3hWZWN0b3JUaWxlXG4gKlxuICogQGxpY2Vuc2UgSVNDXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL01WVFNvdXJjZScpO1xuIl19
