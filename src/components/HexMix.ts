export default {
  uint8ToHex(data: Uint8Array): string {
    return Array.prototype.map.call(data, (byte: number) => {
      return ('00' + byte.toString(16)).slice(-2);
    }).join('');
  },  
  hexToUint8(data: string): Uint8Array {
    const hexArray = data.match(/.{1,2}/g);
    if (!hexArray) return new Uint8Array(0);

    return Uint8Array.from(hexArray.map((char: string) => {
      return parseInt(char, 16)
    }));
  }
}