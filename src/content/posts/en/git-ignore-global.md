---
title: Set Up a Global .gitignore in Git
pubDate: 2024-06-25
description: Learn how to set up a global .gitignore in Git to keep ignore patterns consistent across all your projects.
tags: [git]
locale: en
author: machado
---

# Set Up a Global .gitignore in Git

### Benefits of a global .gitignore:

- Keeps ignore patterns consistent across all your projects.
- Lets you ignore files that are specific to your user environment.

### Things to be careful about:

- It can confuse team members because each person may have different settings.
- Make sure you never accidentally ignore files that are important to the project.

1. **Create or edit the .gitignore_global file**: First, create or edit the `.gitignore_global` file in your home directory. You can do that with the following command:

```
nano ~/.gitignore_global
```

Add the file or directory patterns you want to ignore globally. For example:

```
*.log
*.tmp
.madock
```

2. Configure Git to use the .gitignore_global file: Tell Git to use that file as the global ignore file. Run the command below in your terminal:

```
git config --global core.excludesfile ~/.gitignore_global
```

3. Verify the configuration: To check that the configuration was applied correctly, run:

```
git config --get core.excludesfile
```