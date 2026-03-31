"""
견적서 작성 탭 UI
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime

from data.registration_types import REGISTRATION_TYPES, CAPITAL_BASED_TYPES
from utils.calculator import calculate_fees, format_currency


class EstimateTab(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self._build_ui()

    def _build_ui(self):
        # 상단: 입력 영역
        input_frame = ttk.LabelFrame(self, text="견적 정보 입력", padding=15)
        input_frame.pack(fill=tk.X, padx=10, pady=(10, 5))

        # 고객명
        row = 0
        ttk.Label(input_frame, text="고객명 (의뢰인):").grid(
            row=row, column=0, sticky=tk.W, pady=5, padx=(0, 10)
        )
        self.client_name = ttk.Entry(input_frame, width=30)
        self.client_name.grid(row=row, column=1, sticky=tk.W, pady=5)

        # 법인명
        row += 1
        ttk.Label(input_frame, text="법인명:").grid(
            row=row, column=0, sticky=tk.W, pady=5, padx=(0, 10)
        )
        self.corp_name = ttk.Entry(input_frame, width=30)
        self.corp_name.grid(row=row, column=1, sticky=tk.W, pady=5)

        # 등기 유형 선택
        row += 1
        ttk.Label(input_frame, text="등기 유형:").grid(
            row=row, column=0, sticky=tk.W, pady=5, padx=(0, 10)
        )
        self.reg_type_var = tk.StringVar()
        self.reg_type_combo = ttk.Combobox(
            input_frame,
            textvariable=self.reg_type_var,
            values=REGISTRATION_TYPES,
            state="readonly",
            width=28,
        )
        self.reg_type_combo.grid(row=row, column=1, sticky=tk.W, pady=5)
        self.reg_type_combo.bind("<<ComboboxSelected>>", self._on_type_changed)

        # 자본금/증자액
        row += 1
        self.capital_label = ttk.Label(input_frame, text="자본금/증자액 (원):")
        self.capital_label.grid(row=row, column=0, sticky=tk.W, pady=5, padx=(0, 10))
        self.capital_entry = ttk.Entry(input_frame, width=30)
        self.capital_entry.grid(row=row, column=1, sticky=tk.W, pady=5)
        self.capital_entry.insert(0, "0")

        # 수도권과밀억제권역 체크
        row += 1
        self.metro_var = tk.BooleanVar()
        self.metro_check = ttk.Checkbutton(
            input_frame,
            text="수도권과밀억제권역 (서울·과천·성남·하남·고양 등)",
            variable=self.metro_var,
        )
        self.metro_check.grid(row=row, column=0, columnspan=2, sticky=tk.W, pady=5)

        # 법무사 보수 직접 입력
        row += 1
        ttk.Label(input_frame, text="법무사 보수 (원):").grid(
            row=row, column=0, sticky=tk.W, pady=5, padx=(0, 10)
        )
        self.scrivener_fee_entry = ttk.Entry(input_frame, width=30)
        self.scrivener_fee_entry.grid(row=row, column=1, sticky=tk.W, pady=5)
        ttk.Label(input_frame, text="※ 비워두면 기본값 적용").grid(
            row=row, column=2, sticky=tk.W, pady=5, padx=(5, 0)
        )

        # 버튼 영역
        btn_frame = ttk.Frame(self)
        btn_frame.pack(fill=tk.X, padx=10, pady=5)

        ttk.Button(btn_frame, text="견적서 계산", command=self._calculate).pack(
            side=tk.LEFT, padx=(0, 5)
        )
        ttk.Button(btn_frame, text="초기화", command=self._reset).pack(
            side=tk.LEFT, padx=(0, 5)
        )
        ttk.Button(btn_frame, text="텍스트 저장", command=self._save_text).pack(
            side=tk.LEFT, padx=(0, 5)
        )

        # 하단: 견적서 결과
        result_frame = ttk.LabelFrame(self, text="견적서 미리보기", padding=15)
        result_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(5, 10))

        self.result_text = tk.Text(
            result_frame,
            font=("맑은 고딕", 11),
            wrap=tk.WORD,
            state=tk.DISABLED,
            bg="#FAFAFA",
        )
        scrollbar = ttk.Scrollbar(result_frame, command=self.result_text.yview)
        self.result_text.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.result_text.pack(fill=tk.BOTH, expand=True)

    def _on_type_changed(self, event=None):
        reg_type = self.reg_type_var.get()
        is_capital = reg_type in CAPITAL_BASED_TYPES
        state = "normal" if is_capital else "disabled"
        self.capital_entry.configure(state=state)
        if not is_capital:
            self.capital_entry.configure(state="normal")
            self.capital_entry.delete(0, tk.END)
            self.capital_entry.insert(0, "0")
            self.capital_entry.configure(state="disabled")

    def _parse_amount(self, text):
        """숫자 문자열을 정수로 변환 (쉼표 제거)"""
        cleaned = text.replace(",", "").replace(" ", "").strip()
        if not cleaned:
            return 0
        try:
            return int(cleaned)
        except ValueError:
            return -1

    def _calculate(self):
        reg_type = self.reg_type_var.get()
        if not reg_type:
            messagebox.showwarning("입력 오류", "등기 유형을 선택해주세요.")
            return

        capital = self._parse_amount(self.capital_entry.get())
        if capital < 0:
            messagebox.showwarning("입력 오류", "자본금/증자액을 올바른 숫자로 입력해주세요.")
            return

        is_metro = self.metro_var.get()
        fees = calculate_fees(reg_type, capital, is_metro)
        if fees is None:
            messagebox.showerror("오류", "수수료 데이터를 찾을 수 없습니다.")
            return

        # 법무사 보수 직접 입력 시 덮어쓰기
        custom_scrivener = self.scrivener_fee_entry.get().strip()
        if custom_scrivener:
            custom_amount = self._parse_amount(custom_scrivener)
            if custom_amount < 0:
                messagebox.showwarning("입력 오류", "법무사 보수를 올바른 숫자로 입력해주세요.")
                return
            old_scrivener = fees["법무사 보수"]
            fees["법무사 보수"] = custom_amount
            fees["합계"] = fees["합계"] - old_scrivener + custom_amount

        self._display_estimate(reg_type, capital, is_metro, fees)

    def _display_estimate(self, reg_type, capital, is_metro, fees):
        client = self.client_name.get().strip() or "(미입력)"
        corp = self.corp_name.get().strip() or "(미입력)"
        today = datetime.now().strftime("%Y년 %m월 %d일")
        metro_text = "수도권과밀억제권역" if is_metro else "일반지역"

        lines = []
        lines.append("=" * 50)
        lines.append("            법인등기 견적서")
        lines.append("=" * 50)
        lines.append("")
        lines.append(f"  작성일자: {today}")
        lines.append(f"  의뢰인:   {client}")
        lines.append(f"  법인명:   {corp}")
        lines.append("")
        lines.append("-" * 50)
        lines.append(f"  등기 유형: {reg_type}")
        if capital > 0:
            lines.append(f"  자본금/증자액: {format_currency(capital)}")
        lines.append(f"  지역 구분: {metro_text}")
        lines.append("-" * 50)
        lines.append("")
        lines.append("  [ 비용 내역 ]")
        lines.append("")

        for label in ["등록면허세", "지방교육세", "등기신청수수료", "법무사 보수"]:
            amount = fees[label]
            lines.append(f"    {label:<16s}  {format_currency(amount):>15s}")

        lines.append("")
        lines.append("  " + "-" * 46)
        lines.append(f"    {'합계':<16s}  {format_currency(fees['합계']):>15s}")
        lines.append("  " + "-" * 46)
        lines.append("")
        lines.append("  ※ 본 견적서는 참고용이며, 실제 비용은 다를 수 있습니다.")
        lines.append("  ※ 등록면허세 및 교육세는 관할 지자체에 따라 변동될 수 있습니다.")
        lines.append("  ※ 법무사 보수는 사건의 난이도에 따라 협의 가능합니다.")
        lines.append("")
        lines.append("=" * 50)

        self.result_text.configure(state=tk.NORMAL)
        self.result_text.delete("1.0", tk.END)
        self.result_text.insert("1.0", "\n".join(lines))
        self.result_text.configure(state=tk.DISABLED)

        self._last_estimate = "\n".join(lines)

    def _reset(self):
        self.client_name.delete(0, tk.END)
        self.corp_name.delete(0, tk.END)
        self.reg_type_combo.set("")
        self.capital_entry.configure(state="normal")
        self.capital_entry.delete(0, tk.END)
        self.capital_entry.insert(0, "0")
        self.metro_var.set(False)
        self.scrivener_fee_entry.delete(0, tk.END)
        self.result_text.configure(state=tk.NORMAL)
        self.result_text.delete("1.0", tk.END)
        self.result_text.configure(state=tk.DISABLED)
        self._last_estimate = None

    def _save_text(self):
        if not hasattr(self, "_last_estimate") or not self._last_estimate:
            messagebox.showinfo("안내", "먼저 견적서를 계산해주세요.")
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("텍스트 파일", "*.txt"), ("모든 파일", "*.*")],
            title="견적서 저장",
            initialfile=f"견적서_{datetime.now().strftime('%Y%m%d')}.txt",
        )
        if filepath:
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(self._last_estimate)
                messagebox.showinfo("저장 완료", f"견적서가 저장되었습니다.\n{filepath}")
            except Exception as e:
                messagebox.showerror("저장 실패", f"파일 저장 중 오류가 발생했습니다.\n{e}")
