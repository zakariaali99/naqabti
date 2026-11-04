#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_SRC_DIR = path.join(__dirname, '../frontend/src');
const LOCALES_DIR = path.join(FRONTEND_SRC_DIR, 'i18n/locales');
const SUPPORTED_LANGUAGES = ['en', 'ar'];

/**
 * Recursively find all files with specific extensions
 */
function findFiles(dir, extensions, excludeDirs = []) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !excludeDirs.includes(item)) {
      files = files.concat(findFiles(fullPath, extensions, excludeDirs));
    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract translation keys used in code
 */
function extractUsedKeys() {
  const sourceFiles = findFiles(FRONTEND_SRC_DIR, ['.ts', '.tsx'], ['i18n']);
  const usedKeys = new Set();
  
  // Patterns to match translation usage
  const patterns = [
    /t\(['"`]([^'"`]+)['"`]\)/g,           // t('key.path')
    /t\(['"`]([^'"`]+)['"`],/g,            // t('key.path', options)
    /i18n\.t\(['"`]([^'"`]+)['"`]\)/g,     // i18n.t('key.path')
    /i18n\.t\(['"`]([^'"`]+)['"`],/g,      // i18n.t('key.path', options)
    /labelKey:\s*['"`]([^'"`]+)['"`]/g,    // labelKey: 'key.path'
  ];

  for (const filePath of sourceFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          usedKeys.add(match[1]);
        }
      });
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${filePath}`);
    }
  }

  return Array.from(usedKeys).sort();
}

/**
 * Extract all keys from translation files
 */
function extractAllTranslationKeys(language) {
  const langDir = path.join(LOCALES_DIR, language);
  
  if (!fs.existsSync(langDir)) {
    return {};
  }

  const translationFiles = findFiles(langDir, ['.ts']);
  const allKeys = {};

  for (const filePath of translationFiles) {
    try {
      const namespace = path.basename(filePath, '.ts');
      
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/^import.*$/gm, '');
      content = content.replace(/^export default/, 'module.exports =');
      content = content.replace(/as const;?$/, '');
      
      const tempFile = path.join(__dirname, `temp_unused_${namespace}_${language}.js`);
      fs.writeFileSync(tempFile, content);
      
      const translations = require(tempFile);
      fs.unlinkSync(tempFile);
      
      const flattenedKeys = flattenObject(translations, namespace);
      Object.assign(allKeys, flattenedKeys);
      
    } catch (error) {
      console.warn(`⚠️  Could not parse: ${filePath}`);
    }
  }

  return allKeys;
}

/**
 * Flatten nested object to dot notation
 */
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

/**
 * Remove unused keys from translation files
 */
function removeUnusedKeys(dryRun = true) {
  console.log('🗑️  Removing Unused Translation Keys');
  console.log('====================================\n');

  const usedKeys = extractUsedKeys();
  console.log(`🔑 Found ${usedKeys.length} used keys in codebase\n`);

  for (const lang of SUPPORTED_LANGUAGES) {
    const translationKeys = extractAllTranslationKeys(lang);
    const unusedKeys = Object.keys(translationKeys).filter(key => !usedKeys.includes(key));
    
    console.log(`🌐 Language: ${lang.toUpperCase()}`);
    console.log(`📊 Total keys: ${Object.keys(translationKeys).length}`);
    console.log(`🗑️  Unused keys: ${unusedKeys.length}`);
    
    if (unusedKeys.length > 0) {
      console.log('\n🔍 Unused keys:');
      unusedKeys.forEach(key => {
        console.log(`  - ${key} = "${translationKeys[key]}"`);
      });
      
      if (!dryRun) {
        // Group by namespace for file updates
        const unusedByNamespace = {};
        unusedKeys.forEach(key => {
          const [namespace] = key.split('.');
          if (!unusedByNamespace[namespace]) {
            unusedByNamespace[namespace] = [];
          }
          unusedByNamespace[namespace].push(key);
        });
        
        // Remove from files
        Object.entries(unusedByNamespace).forEach(([namespace, keys]) => {
          removeKeysFromFile(lang, namespace, keys);
        });
        
        console.log(`\n✅ Removed ${unusedKeys.length} unused keys from ${lang} translation files`);
      } else {
        console.log(`\n💡 Run with --remove flag to actually delete these keys`);
      }
    } else {
      console.log('✅ No unused keys found!');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

/**
 * Remove specific keys from a translation file
 */
function removeKeysFromFile(language, namespace, keysToRemove) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.ts`);
  
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Parse existing content
    let existingContent = content.replace(/^import.*$/gm, '');
    existingContent = existingContent.replace(/^export default/, 'const temp =');
    existingContent = existingContent.replace(/as const;?$/, ';');
    existingContent += '\nmodule.exports = temp;';
    
    const tempFile = path.join(__dirname, `temp_remove_${namespace}_${language}.js`);
    fs.writeFileSync(tempFile, existingContent);
    
    const existing = require(tempFile);
    fs.unlinkSync(tempFile);
    
    // Remove specified keys
    const cleaned = removeKeysFromObject(existing, keysToRemove, namespace);
    
    // Write back to file
    const newContent = `export default ${JSON.stringify(cleaned, null, 2)} as const;\n`;
    fs.writeFileSync(filePath, newContent);
    
    console.log(`   ✅ Cleaned ${filePath}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to clean ${filePath}:`, error.message);
  }
}

/**
 * Remove keys from nested object
 */
function removeKeysFromObject(obj, keysToRemove, namespace) {
  const result = { ...obj };
  
  keysToRemove.forEach(key => {
    // Remove namespace prefix
    const keyPath = key.replace(`${namespace}.`, '').split('.');
    
    let current = result;
    for (let i = 0; i < keyPath.length - 1; i++) {
      if (!current[keyPath[i]]) return;
      current = current[keyPath[i]];
    }
    
    delete current[keyPath[keyPath.length - 1]];
  });
  
  // Remove empty objects
  return cleanEmptyObjects(result);
}

/**
 * Recursively remove empty objects
 */
function cleanEmptyObjects(obj) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const cleanedValue = cleanEmptyObjects(value);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

// CLI interface
const shouldRemove = process.argv.includes('--remove') || process.argv.includes('-r');
const command = process.argv[2];

if (command === 'help' || command === '--help' || command === '-h') {
  console.log('Unused Translation Keys Cleaner');
  console.log('===============================\n');
  console.log('Usage:');
  console.log('  node remove-unused-keys.js [--remove]\n');
  console.log('Options:');
  console.log('  --remove, -r   Actually remove unused keys (default is dry-run)\n');
  console.log('Examples:');
  console.log('  node remove-unused-keys.js           # Show unused keys');
  console.log('  node remove-unused-keys.js --remove  # Remove unused keys');
} else {
  removeUnusedKeys(!shouldRemove);
}