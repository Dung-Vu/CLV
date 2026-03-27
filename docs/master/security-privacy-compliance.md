# Security, Privacy & Compliance

> Tài liệu này mô tả các nguyên tắc và biện pháp bảo mật, quyền riêng tư, và tuân thủ tối thiểu mà CLV tuân theo (ở mức dự án cá nhân).

---

## 1. Phạm vi & giả định

- Làm rõ: CLV là tool cá nhân, không phải SaaS public.
- Tuy vậy vẫn cần:
  - Bảo vệ secret (API keys, token).
  - Tránh lộ thông tin nhạy cảm (email, account, log có chứa URL private).

---

## 2. Quản lý secret & cấu hình

- Mô tả cách lưu trữ:
  - `.env` (không commit).
  - Sử dụng `.env.example` để document biến cần thiết.
- Lưu ý khi deploy:
  - Không echo secret trong log.
  - Hạn chế quyền đọc file env.

---

## 3. Dữ liệu người dùng & privacy

- Đối với dữ liệu của riêng bạn:
  - Email, account, thói quen sử dụng, claim history.
- Nguyên tắc:
  - Không log plaintext password (nếu có).
  - Có thể mã hoá một số field nếu cần.
- Nếu sau này dùng cho người khác:
  - Cần tách DB & identity, cân nhắc quy định bảo vệ dữ liệu (GDPR tương đương).

---

## 4. An toàn khi auto-execution

- Nguyên tắc cho executor:
  - Không nhập thông tin tài chính (thẻ) tự động.
  - Chỉ chạy trên site tương đối tin cậy.
  - Sử dụng account/email riêng cho CLV, không dùng tài khoản chính.
- Nêu rõ risk nếu vi phạm ToS của nền tảng bên ngoài.

---

## 5. Cập nhật & vá lỗi

- Quy trình khi phát hiện bug bảo mật:
  - Ghi lại issue (private).
  - Ưu tiên fix trước các feature mới.
- Nếu sử dụng thư viện bên ngoài:
  - Theo dõi security advisories (npm audit, Dependabot, v.v.).

---

## 6. Checklist an ninh cơ bản

- Danh sách kiểm tra ngắn trước khi coi CLV là "master":
  - [ ] Không có secret trong repo.
  - [ ] Logs không chứa dữ liệu nhạy cảm.
  - [ ] Executor bị giới hạn đúng Tier/Policy.
  - [ ] DB backup tối thiểu (nếu mất server vẫn phục hồi được).
