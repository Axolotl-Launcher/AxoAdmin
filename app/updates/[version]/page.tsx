import { notFound } from "next/navigation";
import VersionDetailClient from "./version-detail-client";

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z][0-9A-Za-z.-]*)?(?:\+[0-9A-Za-z.-]+)?$/;

export default async function UpdateDetailPage({ params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  // 版本号必须是规范化 SemVer，否则直接 404，避免任意路径都落到详情页。
  if (!semver.test(version)) notFound();
  return <VersionDetailClient version={version} />;
}
