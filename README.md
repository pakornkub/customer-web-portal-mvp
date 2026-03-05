<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio:
https://ai.studio/apps/drive/18nW-l7W8xx5HFO4S_4ahGNgwWr9ORnBk

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app: `npm run dev`

## UI Typography Standards (Project Governance)

## Project Working Doc

- Main working guide (Design + Flow + Rules):
  [PROJECT_WORKING_GUIDE.md](PROJECT_WORKING_GUIDE.md)

เพื่อให้หน้าจอทุกหน้าใช้ฟอนต์/สี/ระดับหัวข้อแบบเดียวกัน โปรเจคนี้กำหนด utility
classes กลางไว้ใน [index.html](index.html) และให้ใช้ซ้ำแทนการ hardcode class
ขนาดตัวอักษรใหม่ในแต่ละหน้า

### Core classes

- `ui-page-title` → ชื่อหน้าหลัก (H1)
- `ui-page-subtitle` → คำอธิบายใต้ชื่อหน้า
- `ui-section-title` → หัวข้อ section แบบ uppercase (ระดับ block)
- `ui-subheader` → หัวข้อย่อยใน card/panel
- `ui-table-head` → มาตรฐานหัวคอลัมน์ตาราง
- `ui-table-standard` → มาตรฐานข้อความใน body ของตาราง
- `ui-form-label` → label ของ input/select/textarea
- `ui-form-helper` → helper text / note ขนาดเล็ก
- `ui-form-error` → error message ใต้ฟิลด์
- `ui-kicker` → micro heading/tag ขนาดเล็กแบบ uppercase
- `ui-micro-text` → ข้อความขนาดเล็กพิเศษที่ไม่ใช่ label/error

### Usage rules

1. ถ้าเป็นหน้าหลักใหม่ ให้ใช้ `ui-page-title` และ `ui-page-subtitle`
   เป็นค่าเริ่มต้น
2. ตารางใหม่ทุกตารางต้องมี `ui-table-standard` ที่ `<table>` และ `ui-table-head`
   ที่ `<thead>`
3. ฟอร์มใหม่ทุกฟิลด์ให้ใช้ `ui-form-label`; helper/error ให้ใช้ `ui-form-helper`
   / `ui-form-error`
4. หลีกเลี่ยงการใส่ `text-[10px]`, `tracking-[...]`, `uppercase` แบบกระจัดกระจาย
   ถ้าต้องการสไตล์เล็กให้ใช้ `ui-kicker` หรือ `ui-micro-text` ก่อน

### Quick checklist before merge

- [ ] หน้าใหม่ใช้ `ui-page-title` + `ui-page-subtitle`
- [ ] ตารางใช้ `ui-table-head` + `ui-table-standard`
- [ ] ฟอร์มใช้ `ui-form-label` + helper/error กลาง
- [ ] ไม่มี tiny text style hardcode ที่ซ้ำซ้อนโดยไม่จำเป็น
