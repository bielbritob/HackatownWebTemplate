import sys
import os
os.environ["ORT_PROVIDERS"] = "CPUExecutionProvider"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
from rembg import remove
from PIL import Image, ImageEnhance

def processar_imagem(caminho_entrada):
    # Define o nome e caminho da imagem de saída
    nome_arquivo, ext = os.path.splitext(caminho_entrada)
    caminho_saida = f"{nome_arquivo}_profissional.png" # Salvar como PNG

    # 1. Carrega a imagem original
    img = Image.open(caminho_entrada).convert("RGB")

    # --- PASSO 1: Remoção de Fundo (IA) ---
    img_sem_fundo = remove(img)

    # --- PASSO 2: Composição Profissional ---
    # Fundo branco puro
    fundo = Image.new("RGBA", img_sem_fundo.size, (255, 255, 255, 255))
    
    # Compor
    img_profissional = Image.alpha_composite(fundo, img_sem_fundo)

    # --- PASSO 3: Melhoria de Cor e Contraste ---
    img_profissional = img_profissional.convert("RGB")
    
    realcar_contraste = ImageEnhance.Contrast(img_profissional)
    img_profissional = realcar_contraste.enhance(1.1)
    
    realcar_brilho = ImageEnhance.Brightness(img_profissional)
    img_profissional = realcar_brilho.enhance(1.05)

    # --- PASSO 4: Centralizar e Criar Margens ---
    padding_percent = 0.1
    w, h = img_profissional.size
    margem_w = int(w * padding_percent)
    margem_h = int(h * padding_percent)
    
    tela_final = Image.new("RGB", (w + margem_w, h + margem_h), (255, 255, 255))
    tela_final.paste(img_profissional, (margem_w // 2, margem_h // 2))

    # Salva a imagem final
    tela_final.save(caminho_saida, quality=90)

    # IMPRIME APENAS O CAMINHO FINAL PARA O PHP LER!
    print(caminho_saida)
    return caminho_saida

if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_input = sys.argv[1]
        if os.path.exists(img_input):
            try:
                processar_imagem(img_input)
            except Exception as e:
                print(f"ERRO: {str(e)}")
        else:
            print(f"ERRO: Arquivo nao encontrado {img_input}")
    else:
        print("ERRO: Uso: python processar_foto.py <caminho_da_imagem>")
