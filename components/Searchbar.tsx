'use client';

import { scrapeAndStoreProduct } from '@/lib/actions';
import React, { FormEvent, useState } from 'react';

const isValidAmzonProductURL = (url: string): boolean => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    // check hostname contains amazon... or not
    if (
      hostname.includes('amazon.') ||
      hostname.includes('amazon.com') ||
      hostname.endsWith('amazon')
    ) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const isValidLink = isValidAmzonProductURL(searchPrompt);

    if (!isValidLink) alert('Please enter a valid amazon URL');

    try {
      setIsLoading(true);
      // Scrape the product page
      const product = await scrapeAndStoreProduct(searchPrompt);
      console.log(product);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-wrap gap-4 mt-12'>
      <input
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        type='text'
        placeholder='Please enter product link'
        className='searchbar-input'
      />
      <button
        disabled={searchPrompt === ''}
        type='submit'
        className='searchbar-btn'
      >
        {isLoading ? 'Loading...' : 'Search'}
      </button>
    </form>
  );
};

export default Searchbar;
