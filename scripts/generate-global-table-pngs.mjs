import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data){
  const len=Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const typ=Buffer.from(type);
  const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typ,data])),0);
  return Buffer.concat([len, typ, data, crc]);
}
function createPng(width, height, draw){
  const rowBytes=width*4;
  const raw=Buffer.alloc((rowBytes+1)*height);
  for(let y=0;y<height;y++){
    raw[y*(rowBytes+1)]=0;
    for(let x=0;x<width;x++){
      const off=y*(rowBytes+1)+1+x*4;
      const c=draw(x,y,width,height);
      raw[off]=c[0]; raw[off+1]=c[1]; raw[off+2]=c[2]; raw[off+3]=c[3]??255;
    }
  }
  const compressed=zlib.deflateSync(raw);
  const sig=Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}
function generate(label, subtitle, outPath, w=1280, h=800){
  const bg=[0xF9,0xFA,0xFB,255];
  const card=[0xFF,0xFF,0xFF,255];
  const border=[0xE5,0xE7,0xEB,255];
  const primary=[0x3B,0x82,0xF6,255];
  const png=createPng(w,h,(x,y)=>{
    let c=bg;
    if(x>=24 && x<w-24 && y>=80 && y<h-24){
      c=card;
      if(x<26 || x>=w-26 || y<82 || y>=h-26) c=border;
    }
    if(y>=80 && y<120 && x>=24 && x<w-24){
      if(y<82 || y>=118) c=border;
      else if(x<26 || x>=w-26) c=border;
      else c=card;
    }
    if(y>=80 && y<84 && x>=24 && x<w-24) c=primary;
    return c;
  });
  const textChunk=(()=>{
    const key='Title'; const val=label + (subtitle? ' — '+subtitle:'');
    const data=Buffer.concat([Buffer.from(key), Buffer.from([0]), Buffer.from(val)]);
    return chunk('tEXt', data);
  })();
  const withoutIend=png.subarray(0, png.length-12);
  const iend=png.subarray(png.length-12);
  const final=Buffer.concat([withoutIend, textChunk, iend]);
  fs.mkdirSync(path.dirname(outPath), {recursive:true});
  fs.writeFileSync(outPath, final);
  console.log('PNG', outPath, `${w}x${h}`, label);
}

// Global Table UX - Task 28
const baseWire='C:/Users/Ika Repina/Documents/Project/letter-builder/docs/wireframes/global-table-ux';
const baseMock='C:/Users/Ika Repina/Documents/Project/letter-builder/docs/mockups/global-table-ux';

const wireframes=[
  ['table-list.png','Wireframe — Global Table List (Order/Icon Inline)'],
  ['columns.png','Wireframe — Columns Manager (DataTable + Reorder)'],
  ['browse.png','Wireframe — Browse Rows (DataTable + Drawer)'],
  ['column-form.png','Wireframe — Column Form (per-type NRadioGroup/NCheckboxGroup)'],
  ['selector.png','Wireframe — RelationSelector (Search + Empty/Error)'],
  ['row-form.png','Wireframe — DynamicForm (all types + computed live)'],
  ['import.png','Wireframe — Import Modal (quoted CSV)'],
  ['desktop.png','Wireframe — Desktop ≥1024'],
  ['tablet.png','Wireframe — Tablet 768–1023'],
  ['mobile.png','Wireframe — Mobile <768'],
  ['states.png','Wireframe — States (Loading/Empty/Error/Validation/403/Success)'],
];

const mockups=[
  ['table-list.png','Mockup Hi-Fi — Table List (PageShell + inline order/icon)'],
  ['columns.png','Mockup Hi-Fi — Columns Manager (DataTable + Chevron/NPopconfirm)'],
  ['browse.png','Mockup Hi-Fi — Browse Rows (Search/Sort/Drawer)'],
  ['column-form.png','Mockup Hi-Fi — Column Form (NRadioGroup/NCheckboxGroup/NInputNumber)'],
  ['selector.png','Mockup Hi-Fi — RelationSelector (Loading/Empty/Error)'],
  ['row-form.png','Mockup Hi-Fi — DynamicForm (computed live + upload)'],
  ['import.png','Mockup Hi-Fi — Import Modal (quoted + partial)'],
  ['desktop.png','Mockup Hi-Fi — Desktop 1280'],
  ['tablet.png','Mockup Hi-Fi — Tablet 768'],
  ['mobile.png','Mockup Hi-Fi — Mobile 375'],
  ['loading.png','Mockup Hi-Fi — State Loading (NSpin)'],
  ['empty.png','Mockup Hi-Fi — State Empty (NEmpty + CTA)'],
  ['error.png','Mockup Hi-Fi — State Error (NAlert + Retry)'],
  ['validation.png','Mockup Hi-Fi — State Validation (NFormItem)'],
  ['success.png','Mockup Hi-Fi — State Success (Toast)'],
  ['403.png','Mockup Hi-Fi — State 403 (Floating Global)'],
];

wireframes.forEach(([file,label])=> generate(label,'Task 28 · Low-Fi · 1280×800', path.join(baseWire,file)));
mockups.forEach(([file,label])=> generate(label,'Task 28 · Hi-Fi · Token #3B82F6 · 1280×800', path.join(baseMock,file)));

console.log('Done Global Table PNGs');
