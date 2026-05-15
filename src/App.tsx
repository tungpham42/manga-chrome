import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  List,
  Typography,
  Spin,
  message,
  Input,
  Card,
  ConfigProvider,
  Tag,
} from "antd";
import {
  ReadOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  LinkOutlined,
  FireOutlined,
} from "@ant-design/icons";
import {
  authenticate,
  getLatestChapters,
  searchManga,
  getMangaFeed,
  getChapterPages,
} from "./services/mangadex";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

type ViewState = "home" | "mangaFeed" | "reader";

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<ViewState>("home");

  const [mangaList, setMangaList] = useState<any[]>([]);
  const [chapterFeed, setChapterFeed] = useState<any[]>([]);
  const [pages, setPages] = useState<string[]>([]);

  const [selectedMangaTitle, setSelectedMangaTitle] = useState<string>("");

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      await authenticate();
      await loadLatest();
    };
    initApp();
  }, []);

  const loadLatest = async () => {
    try {
      const data = await getLatestChapters();
      setMangaList(data);
    } catch (error) {
      message.error("Oops! Couldn't grab the latest chapters.");
    }
    setLoading(false);
  };

  const handleSearch = async (value: string) => {
    if (!value) return loadLatest();
    setLoading(true);
    try {
      const data = await searchManga(value);
      setMangaList(data);
      setView("home");
    } catch (error) {
      message.error("Search failed. Try another keyword!");
    }
    setLoading(false);
  };

  const handleSelectManga = async (mangaId: string, title: string) => {
    setLoading(true);
    try {
      const feed = await getMangaFeed(mangaId);
      setChapterFeed(feed);
      setSelectedMangaTitle(title);
      setView("mangaFeed");
    } catch (error) {
      message.error("Failed to load manga chapters. Please try again.");
    }
    setLoading(false);
  };

  const handleReadChapter = async (chapterId: string) => {
    setLoading(true);
    try {
      const pageUrls = await getChapterPages(chapterId);
      setPages(pageUrls);
      setView("reader");
    } catch (error) {
      message.error(
        "Whoops! Failed to load pages. The chapter might be unavailable.",
      );
    }
    setLoading(false);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
          colorPrimary: "#ff6b6b", // Fun, vibrant red/pink
          borderRadius: 16, // Bubbly corners
          colorBgContainer: "#ffffff",
          colorTextHeading: "#ff6b6b",
        },
        components: {
          Card: {
            boxShadowSecondary: "0 8px 16px rgba(255, 107, 107, 0.15)",
          },
          Button: {
            fontWeight: "bold",
          },
        },
      }}
    >
      <Layout
        style={{
          width: "400px",
          minHeight: "500px",
          background: "#fff5f5", // Very soft red/pink background
        }}
      >
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
            padding: "0 20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 1,
            height: "64px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              marginRight: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <ReadOutlined style={{ fontSize: "22px", color: "#ff6b6b" }} />
          </div>
          <Title
            level={3}
            style={{
              color: "#333",
              margin: 0,
              fontWeight: 800,
              textShadow: "1px 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            Manga Reader
          </Title>
        </Header>

        <Content
          style={{
            padding: "20px",
            overflowY: "auto",
            maxHeight: "500px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading && (
            <div style={{ margin: "auto", textAlign: "center" }}>
              <Spin size="large" />
              <div
                style={{ marginTop: 12, color: "#ff6b6b", fontWeight: "bold" }}
              >
                Loading awesomeness...
              </div>
            </div>
          )}

          {!loading && view === "home" && (
            <>
              <Search
                placeholder="Search for manga..."
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
                size="large"
                style={{
                  marginBottom: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  borderRadius: "16px",
                }}
              />
              <List
                itemLayout="horizontal"
                dataSource={mangaList}
                renderItem={(item) => {
                  const isChapterMode = item.type === "chapter";
                  const mangaRef = isChapterMode
                    ? item.relationships.find((r: any) => r.type === "manga")
                    : item;

                  const title =
                    mangaRef?.attributes?.title?.en ||
                    mangaRef?.attributes?.title?.["ja-ro"] ||
                    "Unknown Manga";
                  const description = isChapterMode
                    ? `Ch. ${item.attributes.chapter} - ${item.attributes.title || "No Title"}`
                    : mangaRef?.attributes?.description?.en?.substring(0, 50) +
                      "...";

                  const coverArtRef = mangaRef?.relationships?.find(
                    (r: any) => r.type === "cover_art",
                  );
                  const coverFileName = coverArtRef?.attributes?.fileName;
                  const coverUrl = coverFileName
                    ? `https://uploads.mangadex.org/covers/${mangaRef.id}/${coverFileName}.256.jpg`
                    : undefined;

                  return (
                    <Card
                      hoverable
                      style={{
                        marginBottom: "16px",
                        borderRadius: "16px",
                        border: "none",
                        overflow: "hidden",
                      }}
                      bodyStyle={{ padding: "12px" }}
                      onClick={() => handleSelectManga(mangaRef.id, title)}
                    >
                      <Card.Meta
                        avatar={
                          coverUrl ? (
                            <img
                              src={coverUrl}
                              alt="cover"
                              style={{
                                width: 55,
                                height: 80,
                                objectFit: "cover",
                                borderRadius: "8px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 55,
                                height: 80,
                                background: "#f0f0f0",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ReadOutlined style={{ color: "#ccc" }} />
                            </div>
                          )
                        }
                        title={
                          <div
                            style={{
                              whiteSpace: "normal",
                              lineHeight: "1.2",
                              marginBottom: "4px",
                            }}
                          >
                            {title}
                          </div>
                        }
                        description={
                          <div>
                            {isChapterMode && (
                              <Tag
                                color="magenta"
                                style={{ marginBottom: "4px" }}
                              >
                                <FireOutlined /> New Chapter
                              </Tag>
                            )}
                            <br />
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {description}
                            </Text>
                          </div>
                        }
                      />
                    </Card>
                  );
                }}
              />
            </>
          )}

          {!loading && view === "mangaFeed" && (
            <>
              <Button
                type="primary"
                shape="round"
                icon={<ArrowLeftOutlined />}
                onClick={() => setView("home")}
                style={{ width: "fit-content", marginBottom: "20px" }}
              >
                Go Back
              </Button>
              <Card
                style={{
                  marginBottom: "20px",
                  background:
                    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <Title level={4} style={{ margin: 0, color: "#333" }}>
                  {selectedMangaTitle}
                </Title>
              </Card>
              <List
                dataSource={chapterFeed}
                renderItem={(chapter) => {
                  const isExternal = !!chapter.attributes.externalUrl;

                  return (
                    <List.Item
                      style={{
                        background: "white",
                        marginBottom: "10px",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        border: "none",
                      }}
                      actions={[
                        <Button
                          type={isExternal ? "default" : "primary"}
                          shape="round"
                          icon={
                            isExternal ? <LinkOutlined /> : <ReadOutlined />
                          }
                          onClick={() => {
                            if (isExternal) {
                              window.open(
                                chapter.attributes.externalUrl,
                                "_blank",
                              );
                            } else {
                              handleReadChapter(chapter.id);
                            }
                          }}
                        >
                          {isExternal ? "Web" : "Read"}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Text strong>
                            Chapter {chapter.attributes.chapter || "Oneshot"}
                          </Text>
                        }
                        description={
                          chapter.attributes.title ||
                          (isExternal ? "External Host" : "No Title")
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </>
          )}

          {!loading && view === "reader" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Button
                type="primary"
                shape="round"
                icon={<ArrowLeftOutlined />}
                onClick={() => setView("mangaFeed")}
                style={{
                  marginBottom: "20px",
                  alignSelf: "flex-start",
                  position: "sticky",
                  top: "0",
                  zIndex: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                Back to Chapters
              </Button>
              <div
                style={{
                  background: "white",
                  padding: "10px",
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                {pages.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Page ${index + 1}`}
                    style={{
                      width: "100%",
                      marginBottom: "12px",
                      borderRadius: "8px",
                      display: "block",
                    }}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
