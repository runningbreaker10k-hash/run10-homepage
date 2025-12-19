import Link from 'next/link'
import { Mail, Phone, MapPin, Building } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#051735] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 회사정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-600">(주)러닝브레이커</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm">대전광역시 대덕구 비래서로9 2층</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-red-600" />
                <span className="text-gray-300 text-sm">042-710-2058 / 11:00 - 16:00</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-red-600" />
                <span className="text-gray-300 text-sm">runningbreaker10k@gmail.com</span>
              </div>
              <div className="text-xs text-gray-400 pt-2">
                <p>사업자등록번호: 544-86-02889</p>
                <p>대표: 윤 세 준</p>
                {/* 통신판매업신고번호: 2024-서울강남-1234 */}
              </div>
            </div>
          </div>

          {/* 바로가기 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-600">바로가기</h3>
            <div className="space-y-2">
              <Link href="/about" className="block text-gray-300 hover:text-white hover:text-red-200 transition-colors text-sm">
                런텐 소개
              </Link>
              <Link href="/competitions" className="block text-gray-300 hover:text-white hover:text-red-200 transition-colors text-sm">
                런텐 대회
              </Link>
              <Link href="/community" className="block text-gray-300 hover:text-white hover:text-red-200 transition-colors text-sm">
                자유게시판
              </Link>
            </div>
          </div>

          {/* 이용약관 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-600">이용안내</h3>
            <div className="space-y-2">
              <Link href="/terms" className="block text-gray-300 hover:text-white hover:text-red-200 transition-colors text-sm">
                이용약관
              </Link>
              <Link href="/privacy" className="block text-gray-300 hover:text-white hover:text-red-200 transition-colors text-sm">
                개인정보처리방침
              </Link>
              <Link href="/safety" className="block text-gray-300 hover:text-white hover:text-red-200 transition-colors text-sm">
                안전수칙
              </Link>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 leading-relaxed">
                RUN10은 건강한 러닝 문화 확산을 위해 최선을 다하고 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 RUN10(런텐). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}