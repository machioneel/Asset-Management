import React from 'react';

export default function Footer() {
 return (
   <footer 
     className="
       fixed 
       bottom-0 
       left-0 
       right-0 
       bg-white 
       dark:bg-gray-800 
       shadow-inner
       z-40
     "
   >
     <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 md:w-full"> {/* Added md:w-full */}
            © {new Date().getFullYear()} Yayasan As-Salam Joglo. All rights reserved.
        </div>
    </div>
   </footer>
 );
}