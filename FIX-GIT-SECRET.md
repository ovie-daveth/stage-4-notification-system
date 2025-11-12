# Fixing Git Secret Exposure

GitHub Push Protection detected a Google Cloud Service Account credential in `infra/.env`. Follow these steps to remove it from git history:

## Step 1: Remove .env from Git (Already Done)

✅ `.env` file removed from git tracking
✅ `.gitignore` files created
✅ `.env.example` template created

## Step 2: Remove Secret from Git History

You need to remove the secret from the commit history. Here are your options:

### Option A: Using git filter-branch (Recommended for single commit)

```powershell
# Navigate to project root
cd "C:\Users\ovie.omokefe\OneDrive - Premium Trust Bank Limited\Desktop\Personal\hng\stage-4-notification-system"

# Remove .env from the specific commit
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch infra/.env" --prune-empty --tag-name-filter cat -- --all

# Force push to overwrite history (WARNING: This rewrites history)
git push origin --force --all
```

### Option B: Using BFG Repo-Cleaner (Faster, recommended for large repos)

1. **Download BFG Repo-Cleaner:**
   - Download from: https://rtyley.github.io/bfg-repo-cleaner/
   - Or use: `choco install bfg` (if you have Chocolatey)

2. **Remove the file:**
   ```powershell
   # Clone a fresh copy (BFG needs a bare repo)
   git clone --mirror https://github.com/ovie-daveth/stage-4-notification-system.git stage-4-notification-system.git

   # Remove .env file from all commits
   bfg --delete-files infra/.env stage-4-notification-system.git

   # Clean up and push
   cd stage-4-notification-system.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### Option C: Rewrite the Commit (Simplest, if commit hasn't been merged)

```powershell
# Amend the commit to remove .env
git commit --amend

# Force push (only if this is your branch and hasn't been merged)
git push origin HEAD:ovie_docker --force
```

## Step 3: Verify Secret is Removed

```powershell
# Check that .env is no longer in git
git log --all --full-history -- infra/.env

# Should return nothing if successfully removed
```

## Step 4: Rotate the Exposed Secret

⚠️ **IMPORTANT**: Since the secret was exposed, you should:

1. **Rotate the Google Cloud Service Account key:**
   - Go to Google Cloud Console
   - Delete the exposed service account key
   - Create a new service account key
   - Update your local `.env` file with the new key

2. **Review access logs:**
   - Check Google Cloud audit logs for unauthorized access
   - Monitor for any suspicious activity

## Step 5: Prevent Future Issues

✅ `.gitignore` files are now in place
✅ `.env.example` template created
✅ Always use `.env.example` as a template, never commit `.env`

## Quick Fix (If you just want to push without the secret)

If you just want to push your current changes without the secret:

```powershell
# Stage the removal
git add .gitignore infra/.gitignore infra/.env.example
git add infra/.env  # This stages the removal

# Commit
git commit -m "chore: remove .env from git and add .gitignore"

# Push (this will still be blocked if the secret is in history)
git push origin HEAD:ovie_docker
```

If it's still blocked, you MUST remove it from history using one of the methods above.

## Alternative: Allow the Secret (Not Recommended)

If you absolutely must push with the secret (NOT RECOMMENDED):

1. Go to: https://github.com/ovie-daveth/stage-4-notification-system/security/secret-scanning/unblock-secret/35NZAjpYKNpUwF0LEtDy80LjX3h
2. Follow the instructions to allow the secret

**⚠️ WARNING**: This is NOT recommended as it exposes your credentials publicly!

## Best Practices Going Forward

1. ✅ Always add `.env` to `.gitignore` before creating it
2. ✅ Use `.env.example` as a template for documentation
3. ✅ Never commit secrets to git
4. ✅ Use environment variables or secret management services in production
5. ✅ Rotate secrets immediately if exposed

