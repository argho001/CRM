import fs from 'fs';

const html = fs.readFileSync('gmaps_curl.html', 'utf8');
const match = html.match(/window\.APP_INITIALIZATION_STATE=\[([\s\S]*?)\];window/);

if (match) {
  const jsonStr = '[' + match[1] + ']';
  try {
    const data = JSON.parse(jsonStr);
    console.log("Parsed JSON root length:", data.length);
    
    // The main payload is usually in data[3][2] or similar. Let's dump the struct briefly.
    const recurseFind = (obj: any, keyMatch: string, path: string = '') => {
      if (!obj) return;
      if (typeof obj === 'string' && obj.includes(keyMatch)) {
        console.log(`Found string match at ${path}: ${obj}`);
      }
      if (Array.isArray(obj)) {
        obj.forEach((val, i) => recurseFind(val, keyMatch, `${path}[${i}]`));
      } else if (typeof obj === 'object') {
        for (const k in obj) {
          recurseFind(obj[k], keyMatch, `${path}.${k}`);
        }
      }
    };
    
    console.log("Searching for known restaurant inside JSON...");
    recurseFind(data, "Dhaka");
  } catch (e) {
    console.error("JSON parse failed", e.message);
  }
} else {
  console.log("Not found");
}
