#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
 * Validate if a translation key is properly formatted
 */
function isValidTranslationKey(key) {
  // Only allow alphanumeric characters, dots, underscores, and dashes
  // Must start with a letter and contain at least one dot for namespace
  const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z0-9._-]+$/;
  
  // Reject keys with template literals, variables, or special characters
  const invalidPatterns = [
    /\$\{/,           // Template literals ${}
    /\{[^}]*\}/,      // Object destructuring or variables {}
    /\//,             // Slashes (likely URLs or paths)
    /\s/,             // Whitespace
    /[()[\]]/,       // Parentheses or brackets
    /^\./,            // Starting with dot
    /\.$/,            // Ending with dot
    /\.\./,           // Double dots
  ];
  
  if (!validKeyPattern.test(key)) {
    return false;
  }
  
  return !invalidPatterns.some(pattern => pattern.test(key));
}

/**
 * Extract translation keys used in code
 */
function extractUsedKeys() {
  console.log('🔍 Searching for used translation keys...');
  
  const sourceFiles = findFiles(FRONTEND_SRC_DIR, ['.ts', '.tsx'], ['i18n']);
  const usedKeys = new Set();
  
  // Patterns to match translation usage
  const patterns = [
    /t\(['"`]([a-zA-Z0-9._-]+)['"`]\)/g,           // t('key.path') - only alphanumeric, dots, underscores, dashes
    /t\(['"`]([a-zA-Z0-9._-]+)['"`],/g,            // t('key.path', options)
    /i18n\.t\(['"`]([a-zA-Z0-9._-]+)['"`]\)/g,     // i18n.t('key.path')
    /i18n\.t\(['"`]([a-zA-Z0-9._-]+)['"`],/g,      // i18n.t('key.path', options)
    /labelKey:\s*['"`]([a-zA-Z0-9._-]+)['"`]/g,    // labelKey: 'key.path'
  ];

  for (const filePath of sourceFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          if (isValidTranslationKey(key)) {
            usedKeys.add(key);
          } else {
            // Optionally log invalid keys for debugging
            // console.warn(`⚠️  Invalid translation key ignored: ${key} in ${filePath}`);
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${filePath}`);
    }
  }

  return Array.from(usedKeys).sort();
}

/**
 * Safely parse a TypeScript translation file
 */
function parseTranslationFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove import statements
    content = content.replace(/^import.*$/gm, '');
    
    // Handle export default patterns
    content = content.replace(/^export\s+default\s+/, '');
    
    // Remove 'as const' assertion
    content = content.replace(/\s+as\s+const\s*;?\s*$/m, '');
    
    // Remove trailing semicolon
    content = content.replace(/\s*;\s*$/, '');
    
    // Use eval to parse the object (safer than require for simple objects)
    const translations = eval(`(${content})`);
    return translations;
    
  } catch (error) {
    console.warn(`⚠️  Could not parse ${filePath}: ${error.message}`);
    return {};
  }
}

/**
 * Extract all keys from translation files
 */
function extractAllTranslationKeys(language) {
  const langDir = path.join(LOCALES_DIR, language);
  
  if (!fs.existsSync(langDir)) {
    console.warn(`⚠️  Language directory not found: ${langDir}`);
    return {};
  }

  const translationFiles = findFiles(langDir, ['.ts']);
  const allKeys = {};

  for (const filePath of translationFiles) {
    try {
      // Get the namespace (filename without extension)
      const namespace = path.basename(filePath, '.ts');
      
      // Parse the translation file
      const translations = parseTranslationFile(filePath);
      
      // Flatten the translation object and add namespace prefix
      const flattenedKeys = flattenObject(translations, namespace);
      Object.assign(allKeys, flattenedKeys);
      
    } catch (error) {
      console.warn(`⚠️  Could not process translation file: ${filePath}`, error.message);
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
 * Find missing keys in target language
 */
function findMissingKeys(sourceKeys, targetKeys) {
  return Object.keys(sourceKeys).filter(key => !(key in targetKeys));
}

/**
 * Generate missing translation entries
 */
function generateMissingTranslations(missingKeys, sourceTranslations, targetLanguage) {
  const missing = {};
  
  missingKeys.forEach(key => {
    const value = sourceTranslations[key];
    // For now, just copy the source value with a TODO comment
    missing[key] = `TODO_${targetLanguage.toUpperCase()}: ${value}`;
  });
  
  return missing;
}

/**
 * Main function to check used keys
 */
function checkUsedKeys() {
  console.log('🔑 Translation Key Analysis Report');
  console.log('==================================\n');

  const usedKeys = extractUsedKeys();
  console.log(`📊 Found ${usedKeys.length} used translation keys in code:\n`);

  // Group keys by namespace for better readability
  const keysByNamespace = {};
  usedKeys.forEach(key => {
    const [namespace] = key.split('.');
    if (!keysByNamespace[namespace]) {
      keysByNamespace[namespace] = [];
    }
    keysByNamespace[namespace].push(key);
  });

  Object.entries(keysByNamespace).forEach(([namespace, keys]) => {
    console.log(`📁 ${namespace}:`);
    keys.forEach(key => console.log(`   ✓ ${key}`));
    console.log('');
  });

  // Check which keys exist in translation files
  console.log('🏠 Translation File Status:');
  console.log('---------------------------\n');

  for (const lang of SUPPORTED_LANGUAGES) {
    const translationKeys = extractAllTranslationKeys(lang);
    const translationKeysList = Object.keys(translationKeys);
    
    console.log(`🌐 Language: ${lang.toUpperCase()}`);
    console.log(`   📚 Total keys in translation files: ${translationKeysList.length}`);
    
    const missingInTranslations = usedKeys.filter(key => !(key in translationKeys));
    const unusedInTranslations = translationKeysList.filter(key => !usedKeys.includes(key));
    
    if (missingInTranslations.length > 0) {
      console.log(`   ❌ Missing in ${lang} translations: ${missingInTranslations.length}`);
      missingInTranslations.forEach(key => console.log(`      - ${key}`));
    } else {
      console.log(`   ✅ All used keys exist in ${lang} translations`);
    }
    
    if (unusedInTranslations.length > 0) {
      console.log(`   🔶 Unused keys in ${lang} translations: ${unusedInTranslations.length}`);
      if (unusedInTranslations.length <= 10) {
        unusedInTranslations.forEach(key => console.log(`      - ${key}`));
      } else {
        unusedInTranslations.slice(0, 10).forEach(key => console.log(`      - ${key}`));
        console.log(`      ... and ${unusedInTranslations.length - 10} more`);
      }
    }
    
    console.log('');
  }

  return {
    usedKeys,
    translationKeys: SUPPORTED_LANGUAGES.reduce((acc, lang) => {
      acc[lang] = extractAllTranslationKeys(lang);
      return acc;
    }, {})
  };
}

/**
 * Main function to check unused keys
 */
function checkUnusedKeys() {
  console.log('🗑️  Unused Translation Keys Report');
  console.log('==================================\n');

  const usedKeys = extractUsedKeys();
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const translationKeys = extractAllTranslationKeys(lang);
    const unusedKeys = Object.keys(translationKeys).filter(key => !usedKeys.includes(key));
    
    console.log(`🌐 Language: ${lang.toUpperCase()}`);
    console.log(`📊 Total translation keys: ${Object.keys(translationKeys).length}`);
    console.log(`🔑 Used keys: ${usedKeys.length}`);
    console.log(`🗑️  Unused keys: ${unusedKeys.length}\n`);
    
    if (unusedKeys.length > 0) {
      console.log(`Unused keys in ${lang}:`);
      unusedKeys.forEach(key => console.log(`  - ${key}`));
      console.log('');
    }
  }
}

/**
 * Auto-add missing keys to translation files
 */
function autoAddMissingKeys() {
  console.log('🔧 Auto-adding missing translation keys...\n');
  
  const usedKeys = extractUsedKeys();
  const translationKeys = {};
  
  // Load all existing translations
  for (const lang of SUPPORTED_LANGUAGES) {
    translationKeys[lang] = extractAllTranslationKeys(lang);
  }
  
  // Find missing keys for each language
  const englishKeys = translationKeys['en'];
  let hasChanges = false;
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const langKeys = translationKeys[lang];
    const missingKeys = usedKeys.filter(key => !(key in langKeys));
    
    if (missingKeys.length > 0) {
      console.log(`📝 Adding ${missingKeys.length} missing keys to ${lang} translations:`);
      missingKeys.forEach(key => console.log(`   + ${key}`));
      
      // Group by namespace to update files
      const missingByNamespace = {};
      missingKeys.forEach(key => {
        const [namespace, ...rest] = key.split('.');
        
        // Validate namespace name
        if (!namespace || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(namespace)) {
          console.warn(`⚠️  Invalid namespace '${namespace}' for key '${key}', skipping`);
          return;
        }
        
        if (!missingByNamespace[namespace]) {
          missingByNamespace[namespace] = {};
        }
        
        // Create nested object structure
        let current = missingByNamespace[namespace];
        const path = rest;
        
        // Validate all parts of the path
        const isValidPath = path.every(part => /^[a-zA-Z0-9_-]+$/.test(part));
        if (!isValidPath) {
          console.warn(`⚠️  Invalid key path '${key}', skipping`);
          return;
        }
        
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) {
            current[path[i]] = {};
          }
          current = current[path[i]];
        }
        
        // Set the value
        const defaultValue = lang === 'en' ? 
          `TODO: Add translation for ${key}` : 
          (englishKeys[key] || `TODO_${lang.toUpperCase()}: Add translation for ${key}`);
        
        current[path[path.length - 1]] = defaultValue;
      });
      
      // Update translation files
      Object.entries(missingByNamespace).forEach(([namespace, newKeys]) => {
        updateTranslationFile(lang, namespace, newKeys);
      });
      
      hasChanges = true;
      console.log('');
    }
  }
  
  if (!hasChanges) {
    console.log('✅ No missing keys found. All translations are up to date!');
  } else {
    console.log('✅ Successfully updated translation files!');
    console.log('💡 Remember to replace TODO placeholders with actual translations.');
  }
}

/**
 * Update a specific translation file with new keys
 */
function updateTranslationFile(language, namespace, newKeys) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.ts`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`📄 Creating new translation file: ${filePath}`);
    const content = `export default ${JSON.stringify(newKeys, null, 2)} as const;\n`;
    fs.writeFileSync(filePath, content);
    return;
  }
  
  try {
    // Parse existing translations using the safe parser
    const existing = parseTranslationFile(filePath);
    
    // Deep merge new keys with existing
    const merged = deepMerge(existing, newKeys);
    
    // Write back to file with proper TypeScript format
    const newContent = `export default ${JSON.stringify(merged, null, 2)} as const;\n`;
    fs.writeFileSync(filePath, newContent);
    
    console.log(`   ✅ Updated ${filePath}`);
    
  } catch (error) {
    console.error(`   ❌ Failed to update ${filePath}:`, error.message);
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'check':
  case 'used':
    checkUsedKeys();
    break;
  case 'unused':
    checkUnusedKeys();
    break;
  case 'add':
  case 'auto-add':
    autoAddMissingKeys();
    break;
  default:
    console.log('Translation Key Management Tool');
    console.log('===============================\n');
    console.log('Usage:');
    console.log('  node check-translation-keys.js <command>\n');
    console.log('Commands:');
    console.log('  check, used    - Show all used translation keys and their status');
    console.log('  unused         - Show unused translation keys');
    console.log('  add, auto-add  - Automatically add missing keys to translation files\n');
    console.log('Examples:');
    console.log('  node check-translation-keys.js check');
    console.log('  node check-translation-keys.js unused');
    console.log('  node check-translation-keys.js add');
    break;
}