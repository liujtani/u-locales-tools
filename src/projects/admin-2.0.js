module.exports = {
    name: 'admin2',
    groups: [{
        src: 'src/lang/:locale.json',
        dst: 'admin2.json',
        desc: '新版管理后台',
        omitKeys: [
            ['_name'],
            ['langCss']
        ]
    }]
};