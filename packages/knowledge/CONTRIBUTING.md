# Contribution Guide for AVA/CKB

**We sincerely invite you to click on the ⭐ star in the upper right corner of this page to follow this project, which will allow you to receive our latest news in time. Thank you!**

First of all, please make sure you have read the [General Contribution Guide](../../CONTRIBUTING.md).

Check the [User Guide](./USERGUIDE.md) to learn the properties of a Knowledge of Chart Types.

## For Developers

### To Modify the Knowledge of a Chart Type

1. Find the Specific chart id in [`AVA/packages/knowledge/src/base.ts`](./src/base.ts) and modify the values.
2. If what you want to modify is a name, an alias or a def, give the translations for all languages in: [`AVA/packages/knowledge/src/i18n/`](./src/i18n/)
3. Sumbit a [PR](https://github.com/antvis/AVA/pulls) or leave an [issue](https://github.com/antvis/AVA/issues) for discussion first.

### To Add a Chart Type

1. Choose a fine ID for the new chart type, make sure it does not exist in: [`AVA/packages/knowledge/src/chartID.ts`](./src/chartID.ts)
2. Add the knowledge object for the new chart type in: [`AVA/packages/knowledge/src/base.ts`](./src/base.ts)
3. Give the translations for all languages in: [`AVA/packages/knowledge/src/i18n/`](./src/i18n/)
4. Sumbit a [PR](https://github.com/antvis/AVA/pulls) or leave an [issue](https://github.com/antvis/AVA/issues) for discussion first.

### To Modify Options of Knowledge Properties

1. Find the specific *Option Array* in: [`AVA/packages/knowledge/src/interface.ts`](./src/interface.ts)
2. Modify the values and sumbit a [PR](https://github.com/antvis/AVA/pulls) or leave an [issue](https://github.com/antvis/AVA/issues) for discussion first.

## For Non-Developers

You can still contribute to the Chart Knowledge Base and WE DO NEED YOU!

If you are new to GitHub, [get yourself a GitHub Account](https://github.com/join) first.

Check the [User Guide](./USERGUIDE.md) to learn the properties of a Knowledge of Chart Types.

After that, you can help us by creating an [issue](https://github.com/antvis/AVA/issues) or a [pull request](https://github.com/antvis/AVA/pulls).

### Create an Issue

GitHub issues are like comment board where you post your comment, advices, bugs you found, etc.

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/6maXNcnO8T/issue.png" width="600" />
</div>
<br>

Create a new issue on the [issue page](https://github.com/antvis/AVA/issues).

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/gRt9ryUqUc/newissue.png" width="600" />
</div>
<br>

You don't have to do anything about coding. We will reply you to discuss with you. If your suggestions are accepted, we will do the coding things.

* To Modify the Knowledge of a Chart Type?
* To Add a Chart Type?
* To Modify Options of Knowledge Properties?

Just leave your comments in an issue.

### Submit a Pull Request

If you can code or you are not afraid to learn some programming, and you want to make your suggestions as clear as code (or maybe you are just willing to make our lives easier), submit a pull request!

[Learn more about pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests).
