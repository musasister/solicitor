# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec 파일 - 법인등기 실무 업무매뉴얼

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['data', 'data.registration_types', 'data.required_documents', 'ui', 'ui.estimate_tab', 'ui.documents_tab', 'utils', 'utils.calculator'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='법인등기_업무매뉴얼',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
