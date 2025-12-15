// import { useAuth } from "../auth/AuthContext";

import { useEffect, useState } from "react";
import { getFeedService, type FeedResponse } from "../utils/feed.service";
import PostForm from "./Post";
import { useAuth } from "../auth/AuthContext";


const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }) + ' · ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};


export default function AppHome() {
const { user, logout } = useAuth();


const [feedResponse, setFeedResponse] = useState<FeedResponse|null>(null);

  useEffect(()=>{
    getFeedService()
    .then((res)=>{
      setFeedResponse(res);
    })

  }, []);

  return (
    <div className="max-w-xl mx-auto py-8 px-4  min-h-screen">

            <h1 className="text-3xl font-extrabold text-gray-900 text-black mb-6">Latest Feed</h1>
               

            <p >Hello {user?.firstName} {user?.lastName}</p>


            <button className= "top-4 mb-4 left-4 z-10 flex-1 bg-blue-600 hover:bg-indigo-700 text-white font-medium rounded-lg rounded-base text-sm px-4 py-2.5" type="button" onClick={logout}> Logout </button>

                <PostForm />

            <div className="space-y-4">
                {feedResponse?.posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
    </div>
  );
}


const PostCard: React.FC<any> = ({ post }) => {
    const { content, photoURL, user, createdAt } = post;

    return (
        // Card container for a single post
        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 p-4 sm:p-5">
            
            {/* 📝 Header: Author and Date */}
            <div className="flex items-start justify-between mb-3">
                
                {/* Author Information (Twitter style: Name/Handle) */}
                <div className="flex items-center space-x-3">
                    {/* Placeholder for an Avatar (can be improved later) */}
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.handle.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        {/* Twitter-style handle */}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.handle}
                        </p>
                    </div>
                </div>

                {/* Post Date */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {formatDate(createdAt)}
                </p>
            </div>

            {/* 💬 Post Content */}
            <div className="mb-4">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {content}
                </p>
            </div>

            {/* 🖼️ Photo/Image (Conditional Rendering) */}
            {photoURL && (
                <div className="mt-3">
                    <img 
                        src={photoURL} 
                        alt="Post attachment" 
                        className="w-full max-h-96 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                </div>
            )}

        </div>
    );
};