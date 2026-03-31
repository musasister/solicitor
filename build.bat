@echo off
chcp 65001 >nul
echo ============================================
echo   법인등기 실무 업무매뉴얼 - EXE 빌드
echo ============================================
echo.

REM PyInstaller 설치 확인
pip install pyinstaller >nul 2>&1

echo [1/2] 빌드 시작...
pyinstaller build.spec --clean

echo.
if exist "dist\법인등기_업무매뉴얼.exe" (
    echo [2/2] 빌드 완료!
    echo 실행 파일: dist\법인등기_업무매뉴얼.exe
) else (
    echo [오류] 빌드에 실패했습니다.
)

echo.
pause
