import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { Language } from "@prisma/client";
import CompleteButton from "@/components/courses/CompleteButton";
import TopicNavigation from "@/components/courses/TopicNavigation";

async function getTopicData(topicId: string, lang: Language, userId?: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      translations: {
        where: { language: lang }
      },
      module: {
        include: {
          translations: {
            where: { language: lang }
          },
          course: {
            include: {
              translations: {
                where: { language: lang }
              }
            }
          },
        },
      },
    },
  });

  if (!topic) return null;

  // Find next topic
  let nextTopic = await prisma.topic.findFirst({
    where: {
      moduleId: topic.moduleId,
      order: { gt: topic.order }
    },
    orderBy: { order: "asc" },
    select: { id: true }
  });

  if (!nextTopic) {
    const nextModule = await prisma.module.findFirst({
      where: {
        courseId: topic.module.courseId,
        order: { gt: topic.module.order }
      },
      orderBy: { order: "asc" },
      include: {
        topics: {
          orderBy: { order: "asc" },
          take: 1,
          select: { id: true }
        }
      }
    });
    if (nextModule && nextModule.topics.length > 0) {
      nextTopic = { id: nextModule.topics[0].id };
    }
  }

  // Find previous topic
  let prevTopic = await prisma.topic.findFirst({
    where: {
      moduleId: topic.moduleId,
      order: { lt: topic.order }
    },
    orderBy: { order: "desc" },
    select: { id: true }
  });

  if (!prevTopic) {
    const prevModule = await prisma.module.findFirst({
      where: {
        courseId: topic.module.courseId,
        order: { lt: topic.module.order }
      },
      orderBy: { order: "desc" },
      include: {
        topics: {
          orderBy: { order: "desc" },
          take: 1,
          select: { id: true }
        }
      }
    });
    if (prevModule && prevModule.topics.length > 0) {
      prevTopic = { id: prevModule.topics[0].id };
    }
  }

  const progress = userId 
    ? await prisma.userProgress.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId,
          },
        },
      })
    : null;

  return { 
    topic: {
      ...topic,
      title: topic.translations[0]?.title || "Untranslated",
      content: topic.translations[0]?.content || "",
      module: {
        ...topic.module,
        title: topic.module.translations[0]?.title || "Untranslated",
        course: {
          ...topic.module.course,
          title: topic.module.course.translations[0]?.title || "Untranslated"
        }
      }
    }, 
    isCompleted: !!progress,
    nextTopicId: nextTopic?.id || null,
    prevTopicId: prevTopic?.id || null
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>;
}) {
  const { slug, topicId } = await params;
  const session = await getServerSession(authOptions);
  
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.ES;

  const data = await getTopicData(topicId, lang, session?.user?.id);

  if (!data) {
    notFound();
  }

  const { topic, isCompleted, nextTopicId, prevTopicId } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Navigation */}
      <nav className="mb-8 flex justify-between items-center">
        <Link 
          href={`/courses/${slug}`} 
          className="text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white flex items-center gap-2"
        >
          ← {lang === "ES" ? `Volver a ${topic.module.course.title}` : `Back to ${topic.module.course.title}`}
        </Link>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          {topic.module.title}
        </span>
      </nav>

      {/* Content */}
      <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <header className="p-8 md:p-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
          <h1 className="text-3xl md:text-4xl font-extrabold">{topic.title}</h1>
        </header>
        
        <div className="p-8 md:p-12 prose prose-zinc dark:prose-invert max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {topic.content}
          </ReactMarkdown>
        </div>

        {/* Action Footer */}
        <footer className="p-8 md:p-12 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-bold text-lg">{lang === "ES" ? "¿Terminaste de leer?" : "Finished reading?"}</h4>
            <p className="text-sm text-zinc-500">
              {lang === "ES" ? "Marca este tema como completado para seguir tu progreso." : "Mark this topic as completed to track your progress."}
            </p>
          </div>
          
          {session ? (
            <CompleteButton 
              topicId={topic.id} 
              initialCompleted={isCompleted} 
              courseSlug={slug}
              nextTopicId={nextTopicId}
            />
          ) : (
            <Link 
              href="/auth/login" 
              className="px-6 py-2 bg-black text-white rounded-lg font-bold text-sm"
            >
              {lang === "ES" ? "Inicia sesión para guardar progreso" : "Login to Track Progress"}
            </Link>
          )}
        </footer>
      </article>

      <TopicNavigation 
        prevTopicId={prevTopicId}
        nextTopicId={nextTopicId}
        isCompleted={isCompleted}
        courseSlug={slug}
        lang={lang}
      />
    </div>
  );
}
