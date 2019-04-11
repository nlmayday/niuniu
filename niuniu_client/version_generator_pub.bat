SET ver=1.0.1
SET addr=47.104.255.159/renheniuniu


SET srcDir=.\build\jsb-binary\src
SET resDir=.\build\jsb-binary\res
SET menDir=.\assets\res
SET remotDir=.\Hot\renheniuniu


ECHO #############################产生差异文件###############################

node version_generator.js -v %ver% -u http://%addr%/ -s build/jsb-binary/ -d assets/res


ECHO 拷贝 src
xcopy  %srcDir%\*.*			%remotDir%\src\ /Y/E


ECHO 拷贝 res
xcopy  %resDir%\*.*			%remotDir%\res\ /Y/E


ECHO 拷贝更新文件信息
xcopy  %menDir%\*.manifest		%remotDir%\*.manifest /Y


pause;