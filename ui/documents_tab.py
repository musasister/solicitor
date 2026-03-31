"""
필요서류 안내 탭 UI
"""

import tkinter as tk
from tkinter import ttk

from data.registration_types import REGISTRATION_TYPES
from data.required_documents import REQUIRED_DOCUMENTS


class DocumentsTab(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self._check_vars = []
        self._build_ui()

    def _build_ui(self):
        # 상단: 등기 유형 선택
        select_frame = ttk.LabelFrame(self, text="등기 유형 선택", padding=10)
        select_frame.pack(fill=tk.X, padx=10, pady=(10, 5))

        ttk.Label(select_frame, text="등기 유형:").pack(side=tk.LEFT, padx=(0, 10))
        self.reg_type_var = tk.StringVar()
        self.reg_type_combo = ttk.Combobox(
            select_frame,
            textvariable=self.reg_type_var,
            values=REGISTRATION_TYPES,
            state="readonly",
            width=30,
        )
        self.reg_type_combo.pack(side=tk.LEFT)
        self.reg_type_combo.bind("<<ComboboxSelected>>", self._on_type_changed)

        # 진행률 표시
        self.progress_label = ttk.Label(select_frame, text="")
        self.progress_label.pack(side=tk.RIGHT, padx=10)

        # 중앙: 필요서류 목록 (체크리스트)
        list_frame = ttk.LabelFrame(self, text="필요서류 체크리스트", padding=10)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(5, 10))

        # 스크롤 가능한 캔버스
        canvas = tk.Canvas(list_frame, bg="#FAFAFA", highlightthickness=0)
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=canvas.yview)
        self.scrollable_frame = ttk.Frame(canvas)

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all")),
        )

        canvas.create_window((0, 0), window=self.scrollable_frame, anchor=tk.NW)
        canvas.configure(yscrollcommand=scrollbar.set)

        # 마우스 휠 스크롤
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        canvas.bind_all("<MouseWheel>", _on_mousewheel)

        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self._canvas = canvas

        # 안내 라벨
        self.placeholder = ttk.Label(
            self.scrollable_frame,
            text="\n\n   등기 유형을 선택하면 필요서류 목록이 표시됩니다.\n\n"
            "   체크박스로 서류 준비 상황을 관리할 수 있습니다.",
            font=("맑은 고딕", 11),
            foreground="#888888",
        )
        self.placeholder.pack(padx=20, pady=40)

    def _on_type_changed(self, event=None):
        reg_type = self.reg_type_var.get()
        docs = REQUIRED_DOCUMENTS.get(reg_type, [])

        # 기존 위젯 제거
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()
        self._check_vars.clear()

        if not docs:
            ttk.Label(
                self.scrollable_frame,
                text="\n   해당 유형의 필요서류 데이터가 없습니다.",
                font=("맑은 고딕", 11),
                foreground="#888888",
            ).pack(padx=20, pady=40)
            self.progress_label.configure(text="")
            return

        # 헤더
        header = ttk.Label(
            self.scrollable_frame,
            text=f"  {reg_type} - 필요서류 ({len(docs)}건)",
            font=("맑은 고딕", 12, "bold"),
        )
        header.pack(anchor=tk.W, padx=10, pady=(10, 5))

        ttk.Separator(self.scrollable_frame, orient=tk.HORIZONTAL).pack(
            fill=tk.X, padx=10, pady=5
        )

        # 서류 목록
        for i, (doc_name, doc_desc) in enumerate(docs):
            item_frame = ttk.Frame(self.scrollable_frame)
            item_frame.pack(fill=tk.X, padx=10, pady=3)

            var = tk.BooleanVar()
            self._check_vars.append(var)

            cb = ttk.Checkbutton(
                item_frame,
                text=f" {i + 1}. {doc_name}",
                variable=var,
                command=self._update_progress,
            )
            cb.pack(anchor=tk.W)

            desc_label = ttk.Label(
                item_frame,
                text=f"      → {doc_desc}",
                foreground="#555555",
                wraplength=600,
            )
            desc_label.pack(anchor=tk.W, padx=(30, 0))

        self._update_progress()
        self._canvas.yview_moveto(0)

    def _update_progress(self):
        if not self._check_vars:
            self.progress_label.configure(text="")
            return
        checked = sum(1 for v in self._check_vars if v.get())
        total = len(self._check_vars)
        self.progress_label.configure(text=f"준비 완료: {checked}/{total}")
