# ⚠️ SECRETS WARNING ⚠️

## Files That Contain Secrets

The following files contain sensitive information and **MUST NEVER** be committed to Git:

- `config.js` - Contains OpenAI API key
- `.env` - Environment variables (if used)

## Protection

These files are already in `.gitignore` and will be automatically excluded from commits.

## If You See a GitHub Warning

If GitHub warns you about exposed secrets:

1. **DO NOT** commit `config.js` or `.env` files
2. Check that these files are in `.gitignore`
3. If you accidentally committed them:
   ```bash
   git rm --cached config.js
   git commit -m "Remove config.js from tracking"
   git push
   ```
4. Rotate your API key immediately if it was exposed

## Verification

To verify a file is ignored:
```bash
git check-ignore config.js
```

If it returns the filename, it's properly ignored.

