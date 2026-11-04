# Translation Key Management Tools

This directory contains tools to help manage translation keys in the project, ensuring consistency between the codebase and translation files.

## Available Scripts

Run these commands from the `frontend` directory:

### 🔍 Check Translation Keys Usage

```bash
# Show all used translation keys and their status in translation files
npm run i18n:check
# or
npm run i18n:used
```

This will:
- Scan all TypeScript/TSX files for translation key usage
- Show which keys are used in code
- Indicate missing keys in translation files
- Show unused keys in translation files

### 🗑️ Find Unused Translation Keys

```bash
# Show unused translation keys (dry-run)
npm run i18n:unused
# or
npm run i18n:clean
```

### 🔧 Auto-Add Missing Translation Keys

```bash
# Automatically add missing keys to translation files
npm run i18n:add
```

This will:
- Find translation keys used in code but missing from translation files
- Add them to the appropriate translation files with TODO placeholders
- Maintain the existing file structure and formatting

### 🧹 Remove Unused Translation Keys

```bash
# Show unused keys (dry-run)
npm run i18n:clean

# Actually remove unused keys from translation files
npm run i18n:clean:remove
```

⚠️ **Warning**: The `i18n:clean:remove` command will permanently delete unused translation keys. Always run the dry-run version first to review what will be removed.

## Translation Key Patterns Detected

The tools detect these patterns in your code:

- `t('key.path')` - Basic translation usage
- `t('key.path', options)` - Translation with options
- `i18n.t('key.path')` - Direct i18n usage
- `labelKey: 'key.path'` - Configuration objects (like in navigation)

## File Structure

```
frontend/src/i18n/locales/
├── en/               # English translations
│   ├── common.ts
│   ├── auth.ts
│   └── ...
└── ar/               # Arabic translations
    ├── common.ts
    ├── auth.ts
    └── ...
```

## Best Practices

1. **Regular Checks**: Run `npm run i18n:check` regularly to ensure consistency
2. **Before Commits**: Check for unused keys with `npm run i18n:unused`
3. **Adding New Keys**: Use `npm run i18n:add` to automatically add missing keys
4. **Clean Up**: Periodically remove unused keys with `npm run i18n:clean:remove`

## Example Workflow

1. Add new translation usage in code:
   ```tsx
   const { t } = useTranslation();
   return <h1>{t('dashboard.welcome')}</h1>;
   ```

2. Run the check command:
   ```bash
   npm run i18n:check
   ```

3. Auto-add missing keys:
   ```bash
   npm run i18n:add
   ```

4. Update the generated TODO placeholders with actual translations:
   ```typescript
   // Before
   export default {
     welcome: "TODO_AR: Welcome to Dashboard"
   };
   
   // After
   export default {
     welcome: "مرحباً بك في لوحة التحكم"
   };
   ```

## Troubleshooting

### Script Not Found
If you see "script not found" errors, ensure you're running the commands from the `frontend` directory.

### Permission Denied
If you get permission errors, make the scripts executable:
```bash
chmod +x ../scripts/check-translation-keys.js
chmod +x ../scripts/remove-unused-keys.js
```

### Parse Errors
If the tools can't parse translation files, ensure they follow the correct TypeScript export format:
```typescript
export default {
  key: "value",
  nested: {
    key: "value"
  }
} as const;
```