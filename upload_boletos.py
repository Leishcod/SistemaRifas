import os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client

url = 'https://hazmgfjnevtdtssthnso.supabase.co'
key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhem1nZmpuZXZ0ZHRzc3RobnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTQyOTAsImV4cCI6MjExMDk3MDI5MH0.M7HP0o_XaQxjce7dc_rZSd3VejuinRq9vDEiHd69Px4'
supabase = create_client(url, key)

folder = '../rifas_0001_a_2000'
files = sorted([f for f in os.listdir(folder) if f.endswith('.png')])
total_files = len(files)
print(f'Total de archivos a subir: {total_files}')

def upload_file(filename):
    filepath = os.path.join(folder, filename)
    with open(filepath, 'rb') as f:
        data = f.read()
    for attempt in range(3):
        try:
            supabase.storage.from_('boletos').upload(
                filename, 
                data, 
                file_options={'content-type': 'image/png', 'upsert': 'true'}
            )
            return True, filename
        except Exception as e:
            if attempt == 2:
                return False, f'{filename}: {e}'
            time.sleep(0.5)
    return False, filename

start_time = time.time()
uploaded = 0
failed = 0

# Concurrencia de 15 hilos para subida rápida y fluida
with ThreadPoolExecutor(max_workers=15) as executor:
    futures = {executor.submit(upload_file, fn): fn for fn in files}
    for future in as_completed(futures):
        success, res = future.result()
        if success:
            uploaded += 1
        else:
            failed += 1
            print(f'Error en {res}')
        
        if uploaded % 100 == 0 or uploaded == total_files:
            elapsed = time.time() - start_time
            print(f'Progreso: {uploaded}/{total_files} boletos subidos ({uploaded/total_files*100:.1f}%) - {elapsed:.1f}s')

total_time = time.time() - start_time
print(f'=== Finalizado en {total_time:.1f} segundos ===')
print(f'Subidos con éxito: {uploaded}, Errores: {failed}')
