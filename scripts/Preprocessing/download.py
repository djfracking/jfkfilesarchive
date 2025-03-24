import os
import requests
from bs4 import BeautifulSoup

def scrape_pdfs(url, download_folder='pdfs'):
    # Create a folder to store PDFs if it doesn't exist
    if not os.path.exists(download_folder):
        os.makedirs(download_folder)
    
    # Get the page content
    response = requests.get(url)
    response.raise_for_status()  # Raise an error for bad responses
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find all links that end with '.pdf'
    pdf_links = [link.get('href') for link in soup.find_all('a')
                 if link.get('href') and link.get('href').lower().endswith('.pdf')]
    
    for pdf_url in pdf_links:
        # Handle relative URLs
        if not pdf_url.startswith('http'):
            pdf_url = requests.compat.urljoin(url, pdf_url)
        print("Downloading:", pdf_url)
        pdf_response = requests.get(pdf_url)
        pdf_response.raise_for_status()
        
        # Extract filename and save the PDF locally
        file_name = os.path.basename(pdf_url)
        file_path = os.path.join(download_folder, file_name)
        with open(file_path, 'wb') as f:
            f.write(pdf_response.content)
    
    return pdf_links

if __name__ == '__main__':
    url = 'https://www.archives.gov/research/jfk/release-2025'
    pdf_links = scrape_pdfs(url)
    print("Found and downloaded PDFs:")
    for link in pdf_links:
        print(link)
