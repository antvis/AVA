import Image from 'next/image';
import type { BlogPost } from '../../lib/blog';

export default function BlogAuthor({ author }: { author: BlogPost['author'] }) {
  return (
    <span className="blog-author">
      <Image src={author.avatar} width={20} height={20} alt="" />
      <span>{author.name}</span>
    </span>
  );
}
