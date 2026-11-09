import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

source_dir = Path(sys.argv[1])
zip_path = Path(sys.argv[2])

with ZipFile(zip_path, 'w', ZIP_DEFLATED) as archive:
    for file_path in source_dir.rglob('*'):
        if file_path.is_file():
            archive.write(file_path, file_path.relative_to(source_dir))
