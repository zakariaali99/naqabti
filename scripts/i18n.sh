#!/bin/bash

# Translation Management Helper Script
# ===================================

function show_help() {
    echo "🌐 Translation Key Management Tool"
    echo "================================="
    echo ""
    echo "Usage: ./i18n.sh [command]"
    echo ""
    echo "Commands:"
    echo "  check       Show all used translation keys and their status"
    echo "  unused      Show unused translation keys (safe - no changes)"
    echo "  add         Auto-add missing keys to translation files"
    echo "  clean       Show what unused keys would be removed (dry-run)"
    echo "  remove      Actually remove unused keys ⚠️ DESTRUCTIVE"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./i18n.sh check    # Analyze current key usage"
    echo "  ./i18n.sh add      # Add missing keys with TODO placeholders"
    echo "  ./i18n.sh clean    # Preview unused keys before removal"
    echo "  ./i18n.sh remove   # Remove unused keys (be careful!)"
    echo ""
    echo "💡 Always run 'check' or 'unused' commands first to understand"
    echo "   the current state before making changes."
}

# Change to frontend directory
cd "$(dirname "$0")/../frontend" || {
    echo "❌ Error: Could not find frontend directory"
    exit 1
}

case "$1" in
    "check"|"status")
        echo "🔍 Checking translation key usage..."
        npm run i18n:check
        ;;
    "unused")
        echo "🗑️  Finding unused translation keys..."
        npm run i18n:unused
        ;;
    "add"|"auto-add")
        echo "🔧 Auto-adding missing translation keys..."
        npm run i18n:add
        ;;
    "clean"|"dry-run")
        echo "🧹 Showing unused keys (dry-run)..."
        npm run i18n:clean
        ;;
    "remove"|"delete")
        echo "⚠️  WARNING: This will permanently delete unused keys!"
        echo "Press Enter to continue, or Ctrl+C to cancel..."
        read -r
        echo "🗑️  Removing unused translation keys..."
        npm run i18n:clean:remove
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac