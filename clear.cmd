@echo off
REM Delete tracker.json if it exists
if exist tracker.json del /f /q tracker.json

REM Delete all files and folders in downloads\ if it exists
if exist downloads (
    del /f /q downloads\*
    for /d %%i in (downloads\*) do rd /s /q "%%i"
)

REM Delete all files and folders in output\ if it exists
if exist output (
    del /f /q output\*
    for /d %%i in (output\*) do rd /s /q "%%i"
)