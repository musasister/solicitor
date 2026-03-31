"""
법인등기 실무 업무매뉴얼 프로그램
메인 애플리케이션 진입점
"""

import tkinter as tk
from tkinter import ttk
import sys
import os

# PyInstaller 빌드 시 경로 처리
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 모듈 경로 추가
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ui.estimate_tab import EstimateTab
from ui.documents_tab import DocumentsTab


class MainApplication(tk.Tk):
    """법인등기 실무 업무매뉴얼 메인 윈도우"""

    APP_TITLE = "법인등기 실무 업무매뉴얼"
    APP_VERSION = "1.0.0"
    WINDOW_WIDTH = 900
    WINDOW_HEIGHT = 700

    def __init__(self):
        super().__init__()
        self.title(f"{self.APP_TITLE} v{self.APP_VERSION}")
        self._center_window()
        self._setup_style()
        self._build_ui()

    def _center_window(self):
        """윈도우를 화면 중앙에 배치"""
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        x = (screen_w - self.WINDOW_WIDTH) // 2
        y = (screen_h - self.WINDOW_HEIGHT) // 2
        self.geometry(f"{self.WINDOW_WIDTH}x{self.WINDOW_HEIGHT}+{x}+{y}")
        self.minsize(800, 600)

    def _setup_style(self):
        """UI 스타일 설정"""
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass

        style.configure("TNotebook.Tab", padding=[20, 8], font=("맑은 고딕", 11))
        style.configure("TLabel", font=("맑은 고딕", 10))
        style.configure("TButton", font=("맑은 고딕", 10), padding=[10, 5])
        style.configure("TLabelframe.Label", font=("맑은 고딕", 10, "bold"))
        style.configure("TCheckbutton", font=("맑은 고딕", 10))

    def _build_ui(self):
        """메인 UI 구성"""
        # 상단 타이틀
        title_frame = ttk.Frame(self)
        title_frame.pack(fill=tk.X, padx=10, pady=(10, 0))

        title_label = ttk.Label(
            title_frame,
            text=self.APP_TITLE,
            font=("맑은 고딕", 16, "bold"),
        )
        title_label.pack(side=tk.LEFT)

        version_label = ttk.Label(
            title_frame,
            text=f"v{self.APP_VERSION}",
            foreground="#888888",
        )
        version_label.pack(side=tk.LEFT, padx=(10, 0), pady=(5, 0))

        # 탭 노트북
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # 견적서 작성 탭
        self.estimate_tab = EstimateTab(self.notebook)
        self.notebook.add(self.estimate_tab, text="  견적서 작성  ")

        # 필요서류 안내 탭
        self.documents_tab = DocumentsTab(self.notebook)
        self.notebook.add(self.documents_tab, text="  필요서류 안내  ")

        # 하단 상태바
        status_frame = ttk.Frame(self)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)

        ttk.Separator(status_frame, orient=tk.HORIZONTAL).pack(fill=tk.X)
        status_label = ttk.Label(
            status_frame,
            text="  법인등기 실무 업무매뉴얼 | 수수료는 참고용이며 관할 법원/지자체에 따라 다를 수 있습니다.",
            foreground="#888888",
            font=("맑은 고딕", 9),
        )
        status_label.pack(side=tk.LEFT, pady=5)


def main():
    app = MainApplication()
    app.mainloop()


if __name__ == "__main__":
    main()
