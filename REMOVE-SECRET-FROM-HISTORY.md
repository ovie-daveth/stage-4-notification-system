# Remove Secret from Git History

GitHub detected a Google Cloud Service Account credential in commit `4ee1c9e`. You need to remove it from git history before you can push.

## Quick Fix: Rewrite the Commit History

### Option 1: Interactive Rebase (Simplest if commit hasn't been merged)

```powershell
# Navigate to project root
cd "C:\Users\ovie.omokefe\OneDrive - Premium Trust Bank Limited\Desktop\Personal\hng\stage-4-notification-system"

# Start interactive rebase from before the problematic commit
git rebase -i 163bb0e

# In the editor, change the commit from 'pick' to 'edit'
# Save and close

# Remove the .env file from that commit
git rm infra/.env

# Amend the commit
git commit --amend --no-edit

# Continue the rebase
git rebase --continue

# Force push (WARNING: This rewrites history)
git push origin HEAD:ovie_docker --force
```

### Option 2: Filter Branch (Removes from all commits)

```powershell
# Remove .env from all commits in history
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch infra/.env" --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now

# Force push
git push origin --force --all
```

### Option 3: Use BFG Repo-Cleaner (Fastest, recommended)

1. **Install BFG:**
   ```powershell
   # Using Chocolatey
   choco install bfg
   
   # Or download from: https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Remove the file:**
   ```powershell
   # Clone a fresh mirror
   git clone --mirror https://github.com/ovie-daveth/stage-4-notification-system.git stage-4-notification-system.git
   
   # Remove .env from all commits
   bfg --delete-files infra/.env stage-4-notification-system.git
   
   # Clean up
   cd stage-4-notification-system.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Push
   git push --force
   ```

## Verify Secret is Removed

```powershell
# Check that .env is no longer in git history
git log --all --full-history -- infra/.env

# Should return nothing if successfully removed
```

## Important: Rotate the Exposed Secret

⚠️ **Since the secret was exposed, you MUST:**

1. **Go to Google Cloud Console:**
   - Navigate to IAM & Admin > Service Accounts
   - Find the service account that was exposed
   - Delete the exposed key
   - Create a new service account key
   - Update your local `.env` file with the new key

2. **Monitor for unauthorized access:**
   - Check Google Cloud audit logs
   - Review access patterns
   - Set up alerts for suspicious activity

## After Removing from History

Once you've removed the secret from history:

```powershell
# Push your changes
git push origin HEAD:ovie_docker --force

# Verify the push succeeds
git push origin HEAD:ovie_docker
```

## Prevention

✅ `.gitignore` files are now in place
✅ `.env.example` template created
✅ Always use `.env.example` as a template, never commit `.env`

## If You Can't Remove from History

If removing from history is not possible, you can:

1. **Create a new branch from before the commit:**
   ```powershell
   git checkout -b ovie_docker_clean 163bb0e
   git cherry-pick 8ac3d90  # Your latest commit without the secret
   git push origin ovie_docker_clean
   ```

2. **Or allow the secret (NOT RECOMMENDED):**
   - Go to: https://github.com/ovie-daveth/stage-4-notification-system/security/secret-scanning/unblock-secret/35NZAjpYKNpUwF0LEtDy80LjX3h
   - Follow the instructions to allow the secret
   - **⚠️ WARNING**: This exposes your credentials publicly!

