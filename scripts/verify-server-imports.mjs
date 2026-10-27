import fs from 'node:fs';
import path from 'node:path';

// Vite accepts extensionless imports; deployed Node ESM functions do not.
const visited=new Set();
const failures=[];
function visit(file){
  const full=path.resolve(file);
  if(visited.has(full))return;
  visited.add(full);
  const source=fs.readFileSync(full,'utf8');
  for(const match of source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)){
    const specifier=match[1];
    if(!/\.(?:js|mjs|json)$/.test(specifier)){failures.push(file+': '+specifier+' needs a runtime extension');continue;}
    const target=path.resolve(path.dirname(full),specifier);
    const resolved=[target,target.replace(/\.js$/,'.ts')].find(candidate=>fs.existsSync(candidate));
    if(!resolved){failures.push(file+': '+specifier+' cannot be resolved');continue;}
    if(/\.(?:ts|mjs|js)$/.test(resolved))visit(resolved);
  }
}
for(const file of fs.readdirSync('api').filter(file=>file.endsWith('.ts')))visit(path.join('api',file));
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Verified Node ESM imports for '+visited.size+' server modules.');
