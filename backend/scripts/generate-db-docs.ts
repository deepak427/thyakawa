import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Field {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  relation?: string;
}

interface Model {
  name: string;
  fields: Field[];
}

function parseSchema(schemaContent: string): Model[] {
  const models: Model[] = [];
  const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
  
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const fieldsContent = match[2];
    
    const fields: Field[] = [];
    const fieldLines = fieldsContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('@@'));
    
    for (const line of fieldLines) {
      const fieldMatch = line.match(/^\s*(\w+)\s+(\w+(\[\])?(\?)?)/);
      if (fieldMatch) {
        const name = fieldMatch[1];
        const type = fieldMatch[2];
        const isArray = type.includes('[]');
        const isOptional = type.includes('?');
        const baseType = type.replace('[]', '').replace('?', '');
        
        const isUnique = line.includes('@unique');
        const relationMatch = line.match(/@relation\("([^"]+)"/);
        
        fields.push({
          name,
          type: isArray ? `${baseType}[]` : baseType,
          required: !isOptional,
          unique: isUnique,
          relation: relationMatch?.[1]
        });
      }
    }
    
    models.push({ name: modelName, fields });
  }
  
  return models;
}

function generateMarkdown(models: Model[]): string {
  let md = '# Database Architecture\n\n';
  md += `Generated: ${new Date().toLocaleString()}\n\n`;
  md += '## Overview\n\n';
  md += `Total Tables: ${models.length}\n\n`;
  
  md += '## Tables\n\n';
  
  for (const model of models) {
    md += `### ${model.name}\n\n`;
    md += '| Field | Type | Required | Unique | Relation |\n';
    md += '|-------|------|----------|--------|----------|\n';
    
    for (const field of model.fields) {
      md += `| ${field.name} | ${field.type} | ${field.required ? '✓' : ''} | ${field.unique ? '✓' : ''} | ${field.relation || ''} |\n`;
    }
    
    md += '\n';
  }
  
  md += '## Relationships\n\n';
  
  for (const model of models) {
    const relations = model.fields.filter(f => f.relation);
    if (relations.length > 0) {
      md += `### ${model.name}\n\n`;
      for (const rel of relations) {
        md += `- **${rel.name}**: ${rel.type} (${rel.relation})\n`;
      }
      md += '\n';
    }
  }
  
  return md;
}

function generateHTML(models: Model[]): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Architecture</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; }
    .content { padding: 2rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
    }
    .stat-card h3 { font-size: 2rem; margin-bottom: 0.5rem; }
    .stat-card p { opacity: 0.9; }
    .models {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .model-card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s;
    }
    .model-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.1);
      border-color: #667eea;
    }
    .model-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      font-weight: 600;
      font-size: 1.25rem;
    }
    .model-body { padding: 1rem; }
    .field {
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .field:last-child { border-bottom: none; }
    .field-name { font-weight: 500; color: #2d3748; }
    .field-type {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #667eea;
      background: #f7fafc;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }
    .badge-required { background: #fed7d7; color: #c53030; }
    .badge-unique { background: #c6f6d5; color: #22543d; }
    .badge-relation { background: #bee3f8; color: #2c5282; }
    .download-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
      transition: all 0.3s;
    }
    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(102, 126, 234, 0.5);
    }
    @media print {
      body { background: white; padding: 0; }
      .download-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗄️ Database Architecture</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <h3>${models.length}</h3>
          <p>Total Tables</p>
        </div>
        <div class="stat-card">
          <h3>${models.reduce((sum, m) => sum + m.fields.length, 0)}</h3>
          <p>Total Fields</p>
        </div>
        <div class="stat-card">
          <h3>${models.reduce((sum, m) => sum + m.fields.filter(f => f.relation).length, 0)}</h3>
          <p>Relationships</p>
        </div>
      </div>
      <div class="models">`;
  
  for (const model of models) {
    html += `
        <div class="model-card">
          <div class="model-header">${model.name}</div>
          <div class="model-body">`;
    
    for (const field of model.fields) {
      html += `
            <div class="field">
              <div>
                <span class="field-name">${field.name}</span>
                ${field.required ? '<span class="badge badge-required">Required</span>' : ''}
                ${field.unique ? '<span class="badge badge-unique">Unique</span>' : ''}
                ${field.relation ? `<span class="badge badge-relation">${field.relation}</span>` : ''}
              </div>
              <span class="field-type">${field.type}</span>
            </div>`;
    }
    
    html += `
          </div>
        </div>`;
  }
  
  html += `
      </div>
    </div>
  </div>
  <button class="download-btn" onclick="window.print()">📥 Download PDF</button>
</body>
</html>`;
  
  return html;
}

const schemaPath = join(__dirname, '../prisma/schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf-8');
const models = parseSchema(schemaContent);

const markdown = generateMarkdown(models);
const html = generateHTML(models);

const outputDir = join(__dirname, '../../docs');
writeFileSync(join(outputDir, 'database-architecture.md'), markdown);
writeFileSync(join(outputDir, 'database-architecture.html'), html);

console.log('✅ Database documentation generated!');
console.log('📄 Markdown: docs/database-architecture.md');
console.log('🌐 HTML: docs/database-architecture.html');
console.log('\nOpen the HTML file in your browser and click "Download PDF" to save as PDF!');
