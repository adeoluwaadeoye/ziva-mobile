import { useMemo, useRef, useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, FlatList, ImageBackground, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, Spacing } from '@/lib/theme';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/lib/ProductsContext';
import AppHeader from '@/components/AppHeader';

const HERO_SLIDES = [
  { image: require('../../assets/hero-bg1.jpg'), label: 'NEW COLLECTION', title: 'Designed in Lagos.\nWorn Worldwide.' },
  { image: require('../../assets/hero-bg2.jpg'), label: "WOMEN'S EDIT", title: 'Bold Prints.\nTimeless Silhouettes.' },
  { image: require('../../assets/hero-bg3.jpg'), label: "MEN'S COLLECTION", title: 'Power Dressing.\nAfrican Roots.' },
  { image: require('../../assets/hero-bg4.jpg'), label: 'BESPOKE TAILORING', title: 'Made for You.\nPerfect Every Time.' },
];

const CATEGORIES = [
  { label: 'Women', filter: 'women', image: require('../../assets/category-W.jpg') },
  { label: 'Men', filter: 'men', image: require('../../assets/category-M.jpg') },
  { label: 'New In', filter: 'new', image: require('../../assets/category-new.jpg') },
  { label: 'Sale', filter: 'sale', image: require('../../assets/category-sale.jpg') },
];

const PRESS_LOGOS = [
  { name: 'VOGUE', weight: '900' as const }, { name: 'ELLE', weight: '700' as const },
  { name: 'FORBES', weight: '700' as const }, { name: 'CNN STYLE', weight: '600' as const },
  { name: 'GUARDIAN', weight: '800' as const }, { name: 'THISDAY', weight: '700' as const },
];

const BRAND_TAGS = ['Heritage First', 'Made in Nigeria', 'Artisan Partners', 'Sustainable Fashion'];

const SMALL_REVIEWS = [
  { name: 'Caroline N.', location: 'Abuja', initials: 'CN', text: "My Grand Agbada set arrived two days before my son's naming ceremony. Perfect fit, immaculate embroidery. ZIVA has become my go-to for every traditional event." },
  { name: 'Fatima A.', location: 'Kano', initials: 'FA', text: 'The Adire midi dress is absolutely stunning. I love that each piece is unique. Fast delivery and gorgeous packaging. Already ordered two more.' },
];

const TRUST_STATS = [
  { stat: '4.9/5', label: 'Average Rating' }, { stat: '12k+', label: 'Happy Customers' },
  { stat: '98%', label: 'Would Recommend' }, { stat: '10k+', label: 'Orders Fulfilled' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - Spacing.md * 2 - Spacing.sm) / 2;
  const { products: allProducts } = useProducts();
  const featured = useMemo(() => allProducts.filter((p) => p.isFeatured).slice(0, 6), [allProducts]);
  const heroRef = useRef<FlatList>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors, width), [Colors, width]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length;
        heroRef.current?.scrollToOffset({ offset: next * width, animated: true });
        return next;
      });
    }, 10500);
    return () => clearInterval(timer);
  }, [width]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: 460 }}>
          <FlatList
            ref={heroRef} data={HERO_SLIDES} horizontal pagingEnabled scrollEnabled
            showsHorizontalScrollIndicator={false} keyExtractor={(_, i) => String(i)}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setHeroIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <ImageBackground source={item.image} style={[styles.hero, { width }]} imageStyle={{ resizeMode: 'cover' }}>
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroLabel}>{item.label}</Text>
                  <Text style={styles.heroTitle}>{item.title}</Text>
                  <Pressable style={styles.heroCta} onPress={() => router.push('/shop')}>
                    <Text style={styles.heroCtaText}>SHOP NOW</Text>
                  </Pressable>
                </View>
              </ImageBackground>
            )}
          />
          <View style={styles.dotRow}>
            {HERO_SLIDES.map((_, i) => <View key={i} style={[styles.dot, heroIndex === i && styles.dotActive]} />)}
          </View>
        </View>

        <View style={styles.pressSection}>
          <Text style={styles.pressEyebrow}>AS SEEN IN</Text>
          <View style={styles.pressDividerLine} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pressRow}>
            {PRESS_LOGOS.map((item, i) => (
              <View key={item.name} style={styles.pressLogoWrap}>
                <Text style={[styles.pressLogoText, { fontWeight: item.weight }]}>{item.name}</Text>
                {i < PRESS_LOGOS.length - 1 && <View style={styles.pressSep} />}
              </View>
            ))}
          </ScrollView>
          <View style={styles.pressDividerLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((item) => (
              <Pressable key={item.label} style={styles.categoryCard} onPress={() => router.push({ pathname: '/shop', params: { filter: item.filter } })}>
                <ImageBackground source={item.image} style={styles.categoryImage} imageStyle={{ resizeMode: 'cover' }}>
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryLabel}>{item.label}</Text>
                  </View>
                </ImageBackground>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitleInline}>Featured</Text>
            <Pressable onPress={() => router.push('/shop')}><Text style={styles.seeAll}>See all →</Text></Pressable>
          </View>
          <View style={[styles.grid, { paddingHorizontal: Spacing.md }]}>
            {featured.map((product) => <ProductCard key={product.id} product={product} width={cardWidth} />)}
          </View>
        </View>

        {/* Brand Story — always dark */}
        <View style={styles.brandSection}>
          <View style={styles.brandTextBlock}>
            <Text style={styles.brandEyebrow}>OUR STORY</Text>
            <Text style={styles.brandHeading}>{'Crafted with\nHeritage\n& Pride.'}</Text>
            <View style={styles.brandDivider} />
            <Text style={styles.brandBody}>ZIVA was born on the streets of Lagos with one conviction — that Nigerian fashion deserves a global stage. Every piece in our collection is designed in-house and produced by skilled artisans across Nigeria.</Text>
            <Text style={styles.brandBodySmall}>From the Ankara markets of Balogun to the Aso-Oke weavers of Iseyin, we source authenticity and transform it into wearable art for the modern Nigerian.</Text>
            <View style={styles.brandStats}>
              <View style={styles.brandStat}><Text style={styles.brandStatNum}>8+</Text><Text style={styles.brandStatLabel}>YEARS CRAFTING</Text></View>
              <View style={styles.brandStatDivider} />
              <View style={styles.brandStat}><Text style={styles.brandStatNum}>50+</Text><Text style={styles.brandStatLabel}>ARTISAN PARTNERS</Text></View>
              <View style={styles.brandStatDivider} />
              <View style={styles.brandStat}><Text style={styles.brandStatNum}>36</Text><Text style={styles.brandStatLabel}>STATES WE SHIP</Text></View>
            </View>
          </View>
          <ImageBackground source={require('../../assets/story-bg.jpg')} style={styles.brandImage} imageStyle={{ resizeMode: 'cover' }}>
            <View style={styles.estBadge}>
              <Text style={styles.estLabel}>Est.</Text>
              <Text style={styles.estYear}>2019</Text>
            </View>
            <View style={styles.brandImgCaption}>
              <View style={styles.brandImgBar} />
              <View>
                <Text style={styles.captionTop}>Lagos · Nigeria</Text>
                <Text style={styles.captionBottom}>Handcrafted by master artisans</Text>
              </View>
            </View>
          </ImageBackground>
          <Pressable style={styles.brandCta} onPress={() => router.push('/shop')}>
            <Text style={styles.brandCtaText}>SHOP THE COLLECTION</Text>
          </Pressable>
        </View>

        {/* Founder — always dark */}
        <View style={styles.founderSection}>
          <View style={styles.founderQuoteBlock}>
            <Text style={styles.founderEyebrow}>{"FOUNDER'S VISION"}</Text>
            <Text style={styles.founderQuoteMark}>{'"'}</Text>
            <Text style={styles.founderQuote}>{'"Nigerian fashion is not merely clothing — it is a living archive of our culture, history, and identity. At ZIVA, we don\'t just sell clothes; we preserve heritage and make it wearable for the modern world. Every thread tells a story that deserves to be heard."'}</Text>
            <View style={styles.founderDivider} />
            <Text style={styles.founderName}>Anthonia Zane</Text>
            <Text style={styles.founderTitle}>Founder & Chief Executive Officer</Text>
            <Text style={styles.founderEst}>Est. 2019 · Lagos, Nigeria</Text>
            <View style={styles.founderTags}>
              {BRAND_TAGS.map((tag) => (
                <View key={tag} style={styles.founderTag}><Text style={styles.founderTagText}>{tag}</Text></View>
              ))}
            </View>
          </View>
          <ImageBackground source={require('../../assets/founder2.jpg')} style={styles.founderImage} imageStyle={{ resizeMode: 'cover' }}>
            <View style={styles.founderImgCaption}>
              <View style={styles.founderImgBar} />
              <View>
                <Text style={styles.founderImgName}>Anthonia Zane</Text>
                <Text style={styles.founderImgTitle}>Founder & CEO, ZIVA</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsEyebrow}>VERIFIED REVIEWS</Text>
          <Text style={styles.reviewsTitle}>What Our Customers Say</Text>
          <View style={styles.reviewsRatingRow}>
            <Text style={styles.reviewsStars}>★★★★★</Text>
            <Text style={styles.reviewsRatingText}>4.9 average · 12,000+ happy customers</Text>
          </View>
          {/* Featured review — always dark */}
          <View style={styles.featuredReview}>
            <Text style={styles.featuredStars}>★★★★★</Text>
            <Text style={styles.featuredQuoteMark}>{'"'}</Text>
            <Text style={styles.featuredReviewText}>{"I wore the Aso-Oke gown to my cousin's wedding and I was the most photographed guest. The quality is exceptional — you can tell real craftsmanship went into every stitch."}</Text>
            <View style={styles.featuredReviewAuthor}>
              <Image source={require('../../assets/client.jpg')} style={styles.featuredAvatar} contentFit="cover" />
              <View>
                <Text style={styles.featuredAuthorName}>Adesuyi Adebanji</Text>
                <Text style={styles.featuredAuthorLocation}>Victoria Island, Lagos</Text>
              </View>
            </View>
          </View>
          <View style={styles.smallReviews}>
            {SMALL_REVIEWS.map((r) => (
              <View key={r.name} style={styles.smallReview}>
                <Text style={styles.smallStars}>★★★★★</Text>
                <Text style={styles.smallReviewText}>{r.text}</Text>
                <View style={styles.smallReviewFooter}>
                  <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{r.initials}</Text></View>
                  <View>
                    <Text style={styles.smallAuthorName}>{r.name}</Text>
                    <Text style={styles.smallAuthorLocation}>{r.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.trustStats}>
            {TRUST_STATS.map((s, i) => (
              <View key={s.label} style={[styles.trustStat, i < 3 && styles.trustStatBorder]}>
                <Text style={styles.trustStatNum}>{s.stat}</Text>
                <Text style={styles.trustStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>© 2025 ZIVA Fashion. All rights reserved.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>, width: number) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.cream },
    hero: { height: 460, justifyContent: 'flex-end' },
    heroOverlay: { padding: Spacing.lg, paddingBottom: 44, backgroundColor: 'rgba(28,28,28,0.55)', gap: 10 },
    heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, letterSpacing: 3, fontWeight: '600' },
    heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '300', lineHeight: 34 },
    heroCta: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
    heroCtaText: { color: '#FFFFFF', fontSize: 11, letterSpacing: 2, fontWeight: '600' },
    dotRow: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
    pressSection: { backgroundColor: C.white, paddingVertical: 28, alignItems: 'center', gap: 16 },
    pressEyebrow: { fontSize: 9, letterSpacing: 4, color: C.muted, fontWeight: '700', textTransform: 'uppercase' },
    pressDividerLine: { width: '88%', height: 1, backgroundColor: C.border },
    pressRow: { paddingHorizontal: Spacing.lg, alignItems: 'center', gap: 0 },
    pressLogoWrap: { flexDirection: 'row', alignItems: 'center' },
    pressLogoText: { fontSize: 15, color: C.muted, letterSpacing: 2.5, paddingHorizontal: 18 },
    pressSep: { width: 1, height: 18, backgroundColor: C.border },
    section: { marginTop: 32 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '400', letterSpacing: 0.5, color: C.black, paddingHorizontal: Spacing.md, marginBottom: 14 },
    sectionTitleInline: { fontSize: 18, fontWeight: '400', letterSpacing: 0.5, color: C.black },
    seeAll: { fontSize: 12, color: C.muted, letterSpacing: 0.3 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    categoryCard: { width: '50%', height: 170 },
    categoryImage: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    categoryOverlay: { backgroundColor: 'rgba(28,28,28,0.58)', paddingVertical: 10, alignItems: 'center' },
    categoryLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

    // Brand Story — intentionally always dark
    brandSection: { marginTop: 40, backgroundColor: '#1C1C1C' },
    brandTextBlock: { padding: Spacing.lg, gap: 12 },
    brandEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 4, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
    brandHeading: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', lineHeight: 38, letterSpacing: -0.5 },
    brandDivider: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
    brandBody: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
    brandBodySmall: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
    brandStats: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    brandStat: { flex: 1, alignItems: 'center', gap: 4 },
    brandStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
    brandStatNum: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
    brandStatLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textAlign: 'center' },
    brandCta: { alignSelf: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 36, paddingVertical: 14, marginTop: 24, marginBottom: 40 },
    brandCtaText: { color: '#1C1C1C', fontSize: 11, letterSpacing: 2.5, fontWeight: '700' },
    brandImage: { height: 290 },
    estBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, alignItems: 'flex-end' },
    estLabel: { fontSize: 8, letterSpacing: 3, color: 'rgba(0,0,0,0.5)' },
    estYear: { fontSize: 22, fontWeight: '700', color: '#1C1C1C', lineHeight: 26 },
    brandImgCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
    brandImgBar: { width: 2, height: 34, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 2 },
    captionTop: { fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    captionBottom: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 3 },

    // Founder — intentionally always dark
    founderSection: { backgroundColor: '#1C1C1C' },
    founderImage: { height: 350 },
    founderImgCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(0,0,0,0.55)' },
    founderImgBar: { width: 2, height: 36, backgroundColor: 'rgba(255,255,255,0.4)', marginTop: 2 },
    founderImgName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    founderImgTitle: { fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    founderQuoteBlock: { padding: Spacing.lg, gap: 10 },
    founderEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 4, color: 'rgba(255,255,255,0.5)' },
    founderQuoteMark: { fontSize: 56, color: 'rgba(255,255,255,0.12)', lineHeight: 56, fontWeight: '700', marginBottom: -8 },
    founderQuote: { fontSize: 16, color: '#FFFFFF', lineHeight: 26, fontWeight: '500', fontStyle: 'italic' },
    founderDivider: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
    founderName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    founderTitle: { fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5 },
    founderEst: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
    founderTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    founderTag: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6 },
    founderTagText: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 },

    // Reviews
    reviewsSection: { backgroundColor: C.cream, paddingHorizontal: Spacing.md, paddingTop: 40, paddingBottom: 16 },
    reviewsEyebrow: { textAlign: 'center', fontSize: 10, letterSpacing: 4, color: C.black, fontWeight: '700', marginBottom: 8 },
    reviewsTitle: { textAlign: 'center', fontSize: 22, fontWeight: '600', color: C.black, marginBottom: 10 },
    reviewsRatingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24 },
    reviewsStars: { fontSize: 14, color: '#D97706' },
    reviewsRatingText: { fontSize: 12, color: C.muted },
    featuredReview: { backgroundColor: '#1C1C1C', padding: 24, marginBottom: 10, gap: 10 },
    featuredStars: { fontSize: 14, color: '#D97706' },
    featuredQuoteMark: { fontSize: 36, color: 'rgba(255,255,255,0.12)', lineHeight: 36, fontWeight: '700', marginBottom: -4 },
    featuredReviewText: { fontSize: 16, color: '#FFFFFF', lineHeight: 26, fontWeight: '500', fontStyle: 'italic' },
    featuredReviewAuthor: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    featuredAvatar: { width: 52, height: 52, borderRadius: 26 },
    featuredAuthorName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    featuredAuthorLocation: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    smallReviews: { flexDirection: 'row', gap: 8, marginBottom: 28 },
    smallReview: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
    smallStars: { fontSize: 11, color: '#D97706' },
    smallReviewText: { fontSize: 12, color: C.black, lineHeight: 18, flex: 1 },
    smallReviewFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: C.border, paddingTop: 10 },
    smallAvatar: { width: 32, height: 32, backgroundColor: '#1C1C1C', alignItems: 'center', justifyContent: 'center' },
    smallAvatarText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    smallAuthorName: { fontSize: 12, fontWeight: '600', color: C.black },
    smallAuthorLocation: { fontSize: 10, color: C.muted },
    trustStats: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.border, paddingTop: 24, marginBottom: 8 },
    trustStat: { flex: 1, alignItems: 'center', gap: 5 },
    trustStatBorder: { borderRightWidth: 1, borderColor: C.border },
    trustStatNum: { fontSize: 18, fontWeight: '700', color: C.black },
    trustStatLabel: { fontSize: 9, color: C.muted, letterSpacing: 1, textAlign: 'center' },
    footer: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: Spacing.lg, marginBottom: 8 },
  });
}
