import fs from 'fs';
import yaml from 'js-yaml';

// Read status.yaml
const statusYaml = yaml.load(fs.readFileSync('src/status.yaml', 'utf8'));

// Calculate overall energy
const energyValues = { Low: 1, Medium: 2, High: 3 };
const avg = (energyValues[statusYaml.energy.social] + 
            energyValues[statusYaml.energy.mental] + 
            energyValues[statusYaml.energy.physical]) / 3;
const overall = avg <= 1.5 ? 'Low' : avg <= 2.5 ? 'Medium' : 'High';

// Build status.json
const status = {
  energy: {
    ...statusYaml.energy,
    overall
  },
  mood: statusYaml.mood,
  focus: statusYaml.focus,
  open_to: statusYaml.open_to,
  not_open_to: statusYaml.not_open_to,
  note: statusYaml.note,
  updated: new Date().toISOString(),
  ttl_hours: 12
};

// Write status.json
fs.writeFileSync('public/status.json', JSON.stringify(status, null, 2));

// Update timestamps in all files
const timestamp = new Date().toISOString();
const files = [
  '.well-known/hapi.json',
  'public/professional.json',
  'public/availability.json',
  'public/comms.json',
  'public/policy.json'
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(/"updated":\s*"[^"]*"/g, `"updated": "${timestamp}"`);
  fs.writeFileSync(file, updated);
});

console.log(`✓ Updated status and timestamps at ${timestamp}`);
