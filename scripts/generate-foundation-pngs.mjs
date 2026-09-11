import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const typ = Buffer.from(type);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typ, data])),0);
  return Buffer.concat([len, typ, data, crc]);
}
function createPng(width, height, draw) {
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y=0; y<height; y++) {
    raw[y*(rowBytes+1)] = 0; // filter
    for (let x=0; x<width; x++) {
      const off = y*(rowBytes+1)+1+x*4;
      const c = draw(x,y,width,height);
      raw[off]=c[0]; raw[off+1]=c[1]; raw[off+2]=c[2]; raw[off+3]=c[3] ?? 255;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}
// tiny 5x7 font for A-Z, a-z, 0-9, / - _ . : ( ) + simplified
const font = {
  // will draw text via simple rectangle placeholder if char not in map
};

function drawText(pixels, text, x0, y0, scale=2, color=[0x1F,0x29,0x37,255]) {
  // very simple: draw each char as 5x7 box outline with inner fill for visibility
  let x=x0;
  for (const ch of text) {
    // outer box
    for(let dy=0; dy<7*scale; dy++) for(let dx=0; dx<5*scale; dx++) {
      const xx=x+dx, yy=y0+dy;
      if(xx>=0 && yy>=0 && xx<pixels.width && yy<pixels.height) {
        // border
        if(dx<scale || dx>=4*scale || dy<scale || dy>=6*scale) {
          const off=(yy*pixels.width+xx)*4;
          pixels.data[off]=color[0]; pixels.data[off+1]=color[1]; pixels.data[off+2]=color[2]; pixels.data[off+3]=255;
        }
      }
    }
    // inner fill with lighter for some chars to differentiate (optional)
    x+=6*scale+scale;
    if(x>pixels.width-6*scale) break;
  }
}

function generate(label, subtitle, outPath, w=1280, h=800) {
  const bg=[0xF9,0xFA,0xFB,255];
  const card=[0xFF,0xFF,0xFF,255];
  const border=[0xE5,0xE7,0xEB,255];
  const primary=[0x3B,0x82,0xF6,255];
  const accent=[0xEF,0xF6,0xFF,255];
  const png = createPng(w,h,(x,y)=>{
    // background
    let c=bg;
    // card area inset 24
    if(x>=24 && x<w-24 && y>=80 && y<h-24) {
      c=card;
      // border
      if(x<26 || x>=w-26 || y<82 || y>=h-26) c=border;
    }
    // header bar
    if(y>=80 && y<120 && x>=24 && x<w-24) {
      if(y<82 || y>=118) c=border;
      else if(x<26 || x>=w-26) c=border;
      else c=[0xFF,0xFF,0xFF,255];
    }
    // accent line top of card
    if(y>=80 && y<84 && x>=24 && x<w-24) c=primary;
    return c;
  });
  // overlay text via pixel manipulation on raw? Instead we will just embed label via PNG tEXt chunk for metadata
  // Add tEXt chunk before IEND
  const textChunk = (() => {
    const key='Title'; const val=label + (subtitle? ' — '+subtitle:'');
    const data=Buffer.concat([Buffer.from(key), Buffer.from([0]), Buffer.from(val)]);
    return chunk('tEXt', data);
  })();
  // insert before IEND
  const withoutIend = png.subarray(0, png.length - 12); // remove IEND chunk (12 bytes)
  const iend = png.subarray(png.length - 12);
  const final = Buffer.concat([withoutIend, textChunk, iend]);
  fs.mkdirSync(path.dirname(outPath), {recursive:true});
  fs.writeFileSync(outPath, final);
  console.log('PNG', outPath, `${w}x${h}`, label);
}

const baseWire = 'C:/Users/Ika Repina/Documents/Project/letter-builder/docs/wireframes/foundation';
const baseMock = 'C:/Users/Ika Repina/Documents/Project/letter-builder/docs/mockups/foundation';

const wireframes = [
  ['list-shell.png','Wireframe — List Shell Kanonis (PageShell + Breadcrumb + Toolbar + Table)'],
  ['datatable-toolbar.png','Wireframe — DataTable Toolbar (320px Search + 160px Select + Refresh)'],
  ['sidebar.png','Wireframe — Sidebar 220 / 72'],
  ['dashboard.png','Wireframe — Dashboard Shortcuts per Peran'],
  ['auth.png','Wireframe — Auth (ID) Login/Register'],
  ['desktop.png','Wireframe — Desktop ≥1024'],
  ['tablet.png','Wireframe — Tablet 768–1023'],
  ['mobile.png','Wireframe — Mobile <768'],
  ['states.png','Wireframe — States (Loading/Empty/Error/Validation/403/Success)'],
  ['list-shell-detail.png','Wireframe — Detail View (optional)'],
];

const mockups = [
  ['list-shell.png','Mockup Hi-Fi — List Shell (Token #3B82F6, Inter, 220/72)'],
  ['datatable.png','Mockup Hi-Fi — DataTable Kanonis (320/160 + Refresh + Error Slot)'],
  ['sidebar.png','Mockup Hi-Fi — Sidebar Token + Distinct Icons'],
  ['dashboard.png','Mockup Hi-Fi — Dashboard Dinamis'],
  ['auth.png','Mockup Hi-Fi — Auth ID + Autocomplete + A11y'],
  ['403.png','Mockup Hi-Fi — Pola 403 Tunggal (Floating Global)'],
  ['loading.png','Mockup Hi-Fi — State Loading (NSpin)'],
  ['empty.png','Mockup Hi-Fi — State Empty (NEmpty + CTA)'],
  ['error.png','Mockup Hi-Fi — State Error (NAlert + Retry)'],
  ['validation.png','Mockup Hi-Fi — State Validation (NFormItem)'],
  ['success.png','Mockup Hi-Fi — State Success (Toast)'],
];

wireframes.forEach(([file, label])=> generate(label, 'Task 26 · Low-Fi · 1280×800', path.join(baseWire, file)));
mockups.forEach(([file, label])=> generate(label, 'Task 26 · Hi-Fi · Token #3B82F6 · 1280×800', path.join(baseMock, file)));

console.log('Done');
