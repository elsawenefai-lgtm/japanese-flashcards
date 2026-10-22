import ReactMarkdown from 'react-markdown';
import styles from './Markdown.module.css';

/** full_explanation 用的簡易 Markdown；不渲染 HTML */
export function Markdown({ children }: { children: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown skipHtml>{children}</ReactMarkdown>
    </div>
  );
}
