# 观脉 · 人体解剖与无障碍取脉

可部署到 GitHub Pages 的纯静态 3D 教学网站。提供独立男性与女性参考模型、体表/解剖图层、腕部放大、四种情境及四分钟导览。不需要安装依赖或配置服务器。

## 上传与发布（约五步）

1. 解压收到的 `guanmai-github-website.zip`。
2. 在 GitHub 新建一个 **Public** 仓库，例如 `guanmai-anatomy`。
3. 选择 **Add file → Upload files**，上传解压文件夹里的全部文件，然后提交。`index.html`、`runtime.js`、`viewer.js`、`model-catalog.js` 和所有 `.bin` 文件必须在仓库根目录，保持原文件名。不要只上传 ZIP，也不要再套一层文件夹。
4. 打开 **Settings → Pages**；Source 选择 **Deploy from a branch**，Branch 选择 **main**、目录 **/(root)**，点击 **Save**。
5. 等待 GitHub 显示网站地址。首次发布通常需要几分钟；完成地址以 Pages 页面显示为准。

如果上传界面没有选中 `.nojekyll`，可以在仓库根目录新建一个同名空文件。本项目文件名不含下划线，遗漏它通常也不影响发布。

## 网站入口

- `index.html`：首页，可切换男女模型。
- `male.html`：直接进入男性版。
- `female.html`：直接进入女性版。

例如仓库为 `guanmai-anatomy`，网站路径通常是 `https://你的用户名.github.io/guanmai-anatomy/`；女性入口在其后加 `female.html`。该示例是格式说明，不代表已经发布成功。

## 文件说明

- 三个 HTML：展示页面。
- `runtime.js`：Three.js 官方组件的本地打包版。
- `viewer.js`：显示、图层与情境逻辑。
- `model-catalog.js`：两套模型的目录、坐标、分片大小与校验值。
- `male-model-*.bin`、`female-model-*.bin`：已压缩模型分片；每个最大 8 MiB，兼容 GitHub 网页上传。
- `ATTRIBUTION-*.md`、`LICENSE-*`：必须保留的来源和许可。
- `.nojekyll`：静态发布标记。

只有当前选中的模型会被下载；男性模型约 41.6 MB，女性模型约 29.3 MB。加载时会显示进度并检查文件完整性。首次打开速度取决于网络与设备，切换后模型会在本次会话中缓存。

这是网站发布版，请通过 GitHub Pages 的 HTTPS 地址访问。直接双击本地 HTML 时，浏览器可能禁止读取模型分片；本地离线演示请继续使用此前单独交付的离线版本。

## 模型来源与边界

**男性：** BodyParts3D 4.0，2,234 个源网格。BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. 浏览器优化几何来自 https://github.com/ashemag/human-atlas 。署名与改编信息见 `ATTRIBUTION-original.md`。

**女性：** Kristen Browne; Heidi Schlehlein (2023), *3D Reference Organ Set for Female v1.5*, HRA / HuBMAP，888 个源网格，CC BY 4.0。署名与改编信息见 `ATTRIBUTION-female.md`。

女性参考模型的骨骼、肌肉与血管仅覆盖部分结构，不含腕部桡动脉；腕部光点为体表近似教学示意。两套模型来自不同数据源，不能据此推断男女解剖差异。光点未经过临床定位验证，情境裁切不是患者扫描或手术模拟。

Three.js r160 与 meshoptimizer v0.22 使用 MIT 许可。Human Atlas 应用代码许可不取代模型数据的 CC BY 4.0 许可。

## 发布前后检查

文件包已检查页面路径、脚本语法、分片完整性及重组后模型的一致性。尚未由本包生成已发布网站，线上渲染和点击验收需在发布后完成。

如果页面提示某个 `.bin` 文件缺失，请核对所有模型分片是否完整上传到根目录；出现 404 时先确认 Pages 发布完成，以及文件名大小写和路径一致。
